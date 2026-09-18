// Vagas com `especialidade` fora da tabela (importação com a "área" em texto
// livre: "Alimentação e Gastronomia", "Hotelaria / Governança") não entram no
// pré-filtro do Descobrir nem ganham página por função. Este script infere a
// especialidade pelo título (e pelo texto livre como reserva) e grava.
//
//   node --experimental-strip-types src/scripts/normalizar-especialidades.mjs --dry
//   node --experimental-strip-types src/scripts/normalizar-especialidades.mjs
//
// Idempotente: só toca em quem está fora da tabela. O texto original fica em
// `especialidadeOriginal` para auditoria. Lê MONGODB_URI do .env.local.

import { readFileSync } from "node:fs";
import { MongoClient } from "mongodb";
import { ESPECIALIDADES } from "../constants/especialidades.ts";
import { inferirEspecialidade } from "../lib/especialidade-inferida.ts";

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

const uri = env("MONGODB_URI");
if (!uri) {
  console.error("MONGODB_URI não encontrada.");
  process.exit(1);
}

const validos = new Set(ESPECIALIDADES.map((e) => e.value));
const label = (v) => ESPECIALIDADES.find((e) => e.value === v)?.label ?? v;

const client = new MongoClient(uri);
await client.connect();
const vagas = client.db().collection("vagas");

const fora = await vagas.find({ especialidade: { $nin: [...validos] } }).project({ titulo: 1, especialidade: 1, status: 1 }).toArray();
console.log(`${fora.length} vaga(s) com especialidade fora da tabela${dry ? " (simulação)" : ""}\n`);

let outros = 0;
for (const v of fora) {
  const nova = inferirEspecialidade(v.titulo ?? "", v.especialidade, null);
  if (nova === "outro") outros++;
  console.log(`${String(v._id)} | ${(v.titulo ?? "").padEnd(38)} | "${v.especialidade}" → ${nova} (${label(nova)})`);
  if (!dry) {
    await vagas.updateOne(
      { _id: v._id },
      { $set: { especialidade: nova, especialidadeOriginal: v.especialidade, updatedAt: new Date() } }
    );
  }
}

console.log(`\n${fora.length - outros} mapeada(s) para uma função; ${outros} ficaram como "outro".`);
if (dry) console.log("Nada gravado. Rode sem --dry para aplicar.");
await client.close();
