/**
 * Preenche os campos do match nos documentos que já existiam antes dele:
 *   - Profissional: localizacao (GeoJSON), anosExperiencia, raioKm, match.ativo
 *   - Vaga:         localizacao (GeoJSON), match.ativo
 * e cria os índices 2dsphere que o pré-filtro do feed usa.
 *
 * Idempotente — pode rodar quantas vezes quiser.
 * Uso: node src/scripts/backfill-match.mjs [--dry]
 *
 * Requer Node 22.6+ (importa municipios.ts direto; o arquivo não tem imports).
 */

import { MongoClient } from "mongodb";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { geocodificarCidade } from "../constants/municipios.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRY = process.argv.includes("--dry");
const RAIO_PADRAO_KM = 40;

// Lê o .env.local manualmente (mesmo padrão dos outros scripts)
function lerEnv() {
  try {
    const conteudo = readFileSync(resolve(__dirname, "../../.env.local"), "utf-8");
    for (const linha of conteudo.split("\n")) {
      const [chave, ...resto] = linha.split("=");
      if (chave && resto.length) {
        process.env[chave.trim()] = resto.join("=").replace(/^"|"$/g, "").trim();
      }
    }
  } catch {
    console.error("Não foi possível ler o .env.local");
    process.exit(1);
  }
}

// Cópia de Profissional.calcularAnosExperiencia — o model importa Mongoose e
// não vale o custo de carregar aqui.
function calcularAnosExperiencia(experiencias) {
  if (!experiencias?.length) return 0;
  const periodos = experiencias
    .filter((e) => e.dataInicio)
    .map((e) => ({
      inicio: new Date(e.dataInicio).getTime(),
      fim: (e.dataFim ? new Date(e.dataFim) : new Date()).getTime(),
    }))
    .filter((p) => Number.isFinite(p.inicio) && Number.isFinite(p.fim) && p.fim > p.inicio)
    .sort((a, b) => a.inicio - b.inicio);
  if (!periodos.length) return 0;
  const mesclados = [periodos[0]];
  for (const p of periodos.slice(1)) {
    const ultimo = mesclados[mesclados.length - 1];
    if (p.inicio <= ultimo.fim) ultimo.fim = Math.max(ultimo.fim, p.fim);
    else mesclados.push({ ...p });
  }
  const ms = mesclados.reduce((acc, p) => acc + (p.fim - p.inicio), 0);
  return Math.round((ms / (1000 * 60 * 60 * 24 * 365.25)) * 10) / 10;
}

function pontoDe(cidade, estado) {
  const c = geocodificarCidade(cidade, estado);
  return c ? { type: "Point", coordinates: [c.lng, c.lat] } : null;
}

lerEnv();
const client = new MongoClient(process.env.MONGODB_URI);

try {
  await client.connect();
  const db = client.db();

  // ─── Profissionais ─────────────────────────────────────────────────────────
  const profissionais = await db
    .collection("profissionals")
    .find({}, { projection: { cidade: 1, estado: 1, experiencias: 1, raioKm: 1, match: 1 } })
    .toArray();

  let opsP = [];
  let semGeoP = 0;
  for (const p of profissionais) {
    const localizacao = pontoDe(p.cidade, p.estado);
    if (!localizacao) semGeoP++;
    opsP.push({
      updateOne: {
        filter: { _id: p._id },
        update: {
          $set: {
            localizacao,
            anosExperiencia: calcularAnosExperiencia(p.experiencias),
            raioKm: p.raioKm ?? RAIO_PADRAO_KM,
            "match.ativo": p.match?.ativo ?? true,
          },
        },
      },
    });
  }

  // ─── Vagas ─────────────────────────────────────────────────────────────────
  const vagas = await db
    .collection("vagas")
    .find({}, { projection: { cidade: 1, estado: 1, match: 1 } })
    .toArray();

  let opsV = [];
  let semGeoV = 0;
  for (const v of vagas) {
    const localizacao = pontoDe(v.cidade, v.estado);
    if (!localizacao) semGeoV++;
    opsV.push({
      updateOne: {
        filter: { _id: v._id },
        update: { $set: { localizacao, "match.ativo": v.match?.ativo ?? true } },
      },
    });
  }

  console.log(`Profissionais: ${profissionais.length} (${semGeoP} sem cidade mapeada → só UF)`);
  console.log(`Vagas:         ${vagas.length} (${semGeoV} sem cidade mapeada → só UF)`);

  if (DRY) {
    console.log("--dry: nada gravado.");
  } else {
    if (opsP.length) await db.collection("profissionals").bulkWrite(opsP, { ordered: false });
    if (opsV.length) await db.collection("vagas").bulkWrite(opsV, { ordered: false });

    // Índices geo (o Mongoose também cria no boot; aqui garantimos antes do primeiro feed).
    await db.collection("profissionals").createIndex({ localizacao: "2dsphere" });
    await db.collection("vagas").createIndex({ localizacao: "2dsphere" });
    await db.collection("swipes").createIndex({ vagaId: 1, profissionalId: 1, autorTipo: 1 }, { unique: true });
    await db.collection("matches").createIndex({ vagaId: 1, profissionalId: 1 }, { unique: true });

    console.log("✅ Backfill concluído e índices criados.");
  }
} finally {
  await client.close();
}
