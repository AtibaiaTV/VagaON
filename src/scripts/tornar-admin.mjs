/**
 * Script para promover um usuário a admin.
 * Uso: node src/scripts/tornar-admin.mjs seuemail@exemplo.com
 */

import { MongoClient } from "mongodb";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Lê o .env.local manualmente
function lerEnv() {
  try {
    const envPath = resolve(__dirname, "../../.env.local");
    const conteudo = readFileSync(envPath, "utf-8");
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

lerEnv();

const email = process.argv[2];
if (!email) {
  console.error("Uso: node src/scripts/tornar-admin.mjs seuemail@exemplo.com");
  process.exit(1);
}

const client = new MongoClient(process.env.MONGODB_URI);

try {
  await client.connect();
  const db = client.db();

  const resultado = await db.collection("users").findOneAndUpdate(
    { email: email.toLowerCase() },
    { $set: { role: "admin" } },
    { returnDocument: "after" }
  );

  if (!resultado) {
    console.error(`❌ Usuário com e-mail "${email}" não encontrado.`);
    process.exit(1);
  }

  console.log(`✅ Usuário "${resultado.name}" (${resultado.email}) agora é ADMIN!`);
  console.log("   Faça logout e login novamente para a sessão atualizar.");
} finally {
  await client.close();
}
