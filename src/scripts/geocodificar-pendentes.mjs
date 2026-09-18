// Preenche `localizacao` de profissionais e vagas que têm cidade/UF mas ainda
// não têm coordenadas (a tabela de municípios só passou a cobrir o Brasil
// inteiro agora; os hooks do Mongoose só geocodificam ao salvar).
// Sem coordenadas gravadas, o filtro por raio ($geoWithin) não enxerga o perfil.
//
//   node --experimental-strip-types src/scripts/geocodificar-pendentes.mjs --dry
//   node --experimental-strip-types src/scripts/geocodificar-pendentes.mjs
//
// Idempotente: só toca em quem está sem coordenadas. Lê MONGODB_URI do
// .env.local ou do ambiente.

import { readFileSync } from "node:fs";
import { MongoClient } from "mongodb";
import { MUNICIPIOS_IBGE } from "../constants/municipios-ibge.ts";

const dry = process.argv.includes("--dry");

function env(nome) {
  if (process.env[nome]) return process.env[nome];
  try {
    const linha = readFileSync(".env.local", "utf8").split("\n").find((l) => l.startsWith(`${nome}=`));
    return linha ? linha.slice(nome.length + 1).trim().replace(/^["']|["']$/g, "") : undefined;
  } catch {
    return undefined;
  }
}

// Mesma normalização de src/constants/municipios.ts.
function normalizarCidade(cidade) {
  return String(cidade ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[-']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function geocodificar(cidade, estado) {
  const nome = normalizarCidade(cidade);
  const uf = String(estado ?? "").trim().toUpperCase();
  if (!nome || !uf) return null;
  return MUNICIPIOS_IBGE[`${uf}:${nome}`] ?? null;
}

const uri = env("MONGODB_URI");
if (!uri) {
  console.error("MONGODB_URI não encontrada.");
  process.exit(1);
}

const cliente = new MongoClient(uri);
await cliente.connect();
const db = cliente.db();

const semCoords = { $or: [{ localizacao: null }, { localizacao: { $exists: false } }, { "localizacao.coordinates": { $exists: false } }] };

for (const [colecao, rotulo] of [["profissionals", "profissionais"], ["vagas", "vagas"]]) {
  const docs = await db.collection(colecao).find(semCoords).project({ cidade: 1, estado: 1 }).toArray();
  let ok = 0, semCidade = 0, naoAchou = [];
  for (const d of docs) {
    if (!d.cidade) { semCidade++; continue; }
    const c = geocodificar(d.cidade, d.estado);
    if (!c) { naoAchou.push(`${d.cidade}/${d.estado || "?"}`); continue; }
    if (!dry) {
      await db.collection(colecao).updateOne({ _id: d._id }, { $set: { localizacao: { type: "Point", coordinates: [c.lng, c.lat] } } });
    }
    ok++;
  }
  console.log(
    `${dry ? "[simulação] " : ""}${rotulo}: ${docs.length} sem coordenadas → ${ok} ${dry ? "a preencher" : "preenchidas"}, ${semCidade} sem cidade, ${naoAchou.length} cidade não reconhecida${naoAchou.length ? ": " + [...new Set(naoAchou)].slice(0, 10).join(", ") : ""}`
  );
}

await cliente.close();
