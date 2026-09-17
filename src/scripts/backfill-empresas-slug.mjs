/**
 * Gera o slug da página pública para empresas criadas antes do campo existir.
 * Idempotente: só toca em quem não tem slug.
 *
 * Uso: node src/scripts/backfill-empresas-slug.mjs [--dry]
 */

import { MongoClient } from "mongodb";
import slugify from "slugify";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRY = process.argv.includes("--dry");

function lerEnv() {
  try {
    const conteudo = readFileSync(resolve(__dirname, "../../.env.local"), "utf-8");
    for (const linha of conteudo.split("\n")) {
      const [chave, ...resto] = linha.split("=");
      if (chave && resto.length && !chave.startsWith("#")) {
        process.env[chave.trim()] = resto.join("=").replace(/^"|"$/g, "").trim();
      }
    }
  } catch {
    console.error("Não foi possível ler o .env.local");
    process.exit(1);
  }
}

// Mesma regra de src/models/Empresa.ts (slugBase).
function slugBase(nome) {
  const s = slugify(nome ?? "", { lower: true, strict: true, locale: "pt", trim: true }).slice(0, 60);
  return s || "empresa";
}

lerEnv();
const client = new MongoClient(process.env.MONGODB_URI);

try {
  await client.connect();
  const col = client.db().collection("empresas");

  const usados = new Set((await col.distinct("slug")).filter(Boolean));
  const semSlug = await col
    .find({ $or: [{ slug: null }, { slug: { $exists: false } }] }, { projection: { nomeFantasia: 1 } })
    .toArray();

  const ops = [];
  for (const e of semSlug) {
    const base = slugBase(e.nomeFantasia);
    let candidato = base;
    for (let n = 2; usados.has(candidato); n++) candidato = `${base}-${n}`;
    usados.add(candidato);
    ops.push({ updateOne: { filter: { _id: e._id }, update: { $set: { slug: candidato } } } });
    console.log(`  ${String(e.nomeFantasia).padEnd(40)} → /empresas/${candidato}`);
  }

  console.log(`\n${semSlug.length} empresa(s) sem slug`);
  if (DRY) {
    console.log("--dry: nada gravado.");
  } else {
    if (ops.length) await col.bulkWrite(ops, { ordered: false });
    await col.createIndex({ slug: 1 }, { unique: true, sparse: true });
    console.log("✅ Slugs gravados e índice criado.");
  }
} finally {
  await client.close();
}
