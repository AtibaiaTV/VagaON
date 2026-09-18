// Concede período de teste do plano Pro a todas as empresas que ainda não
// têm assinatura nem trial — para o dia em que PLANOS_ATIVOS ligar, ninguém
// da base atual perde acesso de uma hora para outra.
//
//   node src/scripts/conceder-trial.mjs --dias 60 --dry
//   node src/scripts/conceder-trial.mjs --dias 60
//
// Lê MONGODB_URI do .env.local (mesmo padrão dos outros scripts).

import { readFileSync } from "node:fs";
import { MongoClient } from "mongodb";

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const idx = args.indexOf("--dias");
const dias = idx >= 0 ? Number(args[idx + 1]) : 60;
if (!Number.isFinite(dias) || dias <= 0) {
  console.error("Informe --dias N (inteiro positivo).");
  process.exit(1);
}

function lerEnv() {
  try {
    const conteudo = readFileSync(".env.local", "utf8");
    const linha = conteudo.split("\n").find((l) => l.startsWith("MONGODB_URI="));
    return linha ? linha.slice("MONGODB_URI=".length).trim().replace(/^["']|["']$/g, "") : process.env.MONGODB_URI;
  } catch {
    return process.env.MONGODB_URI;
  }
}

const uri = lerEnv();
if (!uri) {
  console.error("MONGODB_URI não encontrada.");
  process.exit(1);
}

const cliente = new MongoClient(uri);
await cliente.connect();
const empresas = cliente.db().collection("empresas");

const filtro = {
  $or: [
    { assinatura: { $exists: false } },
    { "assinatura.status": { $in: [null, "nenhuma"] }, "assinatura.trialAte": null },
  ],
};
const total = await empresas.countDocuments(filtro);
const ate = new Date();
ate.setDate(ate.getDate() + dias);
ate.setHours(23, 59, 59, 999);

console.log(`${total} empresa(s) sem assinatura nem trial. Trial até ${ate.toISOString()}.`);

if (dry) {
  console.log("(--dry: nada gravado)");
} else {
  const r = await empresas.updateMany(filtro, {
    $set: {
      "assinatura.plano": "gratis",
      "assinatura.status": "trial",
      "assinatura.trialAte": ate,
      "assinatura.provedor": "manual",
      "assinatura.atualizadoEm": new Date(),
    },
  });
  console.log(`Atualizadas: ${r.modifiedCount}`);
}

await cliente.close();
