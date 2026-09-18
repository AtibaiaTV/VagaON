// Tira as fotos em base64 de `User.image` (54 contas, ~70 MB — derrubava a
// listagem do admin) sem perder nenhuma foto:
//
//   1. Profissional SEM `fotoPerfil`: sobe a base64 para o Cloudinary
//      (mesma pasta e recorte do /api/upload) e grava a URL em fotoPerfil.
//   2. Em todos: `User.image` vira null.
//
// Quem já tinha fotoPerfil no Cloudinary só tem o campo limpo — a foto do
// perfil, que é a que aparece, não muda.
//
//   node src/scripts/migrar-fotos-user.mjs --dry     # só relata
//   node src/scripts/migrar-fotos-user.mjs           # executa
//
// Lê MONGODB_URI e as credenciais do Cloudinary do .env.local (ou do ambiente).
// Idempotente: rodar duas vezes não sobe nada de novo.

import { readFileSync } from "node:fs";
import { MongoClient } from "mongodb";
import { v2 as cloudinary } from "cloudinary";

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

const cloudName = env("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
const apiKey = env("CLOUDINARY_API_KEY");
const apiSecret = env("CLOUDINARY_API_SECRET");
if (!dry && !(cloudName && apiKey && apiSecret)) {
  console.error("Cloudinary não configurado (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).");
  process.exit(1);
}
if (!dry) cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

const cliente = new MongoClient(uri);
await cliente.connect();
const db = cliente.db();
const users = db.collection("users");
const profissionais = db.collection("profissionals");

const contas = await users
  .find({ image: /^data:image\// })
  .project({ _id: 1, name: 1, image: 1 })
  .toArray();

console.log(`${dry ? "[simulação] " : ""}${contas.length} conta(s) com foto em base64 no User.`);

let subidas = 0, limpas = 0, falhas = 0, semPerfil = 0;
for (const u of contas) {
  const perfil = await profissionais.findOne({ userId: u._id }, { projection: { _id: 1, fotoPerfil: 1 } });
  const kb = Math.round(u.image.length / 1024);

  if (!perfil) {
    // Conta sem perfil de profissional: não há onde guardar a foto; só limpa.
    semPerfil++;
    console.log(`  ${u.name}: sem perfil profissional (${kb} KB) → limpar User.image`);
  } else if (perfil.fotoPerfil) {
    console.log(`  ${u.name}: já tem fotoPerfil no Cloudinary (${kb} KB no User) → só limpar`);
  } else {
    console.log(`  ${u.name}: sem fotoPerfil → subir ${kb} KB para o Cloudinary e gravar no perfil`);
    if (!dry) {
      try {
        const r = await cloudinary.uploader.upload(u.image, {
          folder: "vagaon/profissionais",
          width: 400,
          height: 400,
          crop: "fill",
        });
        await profissionais.updateOne({ _id: perfil._id }, { $set: { fotoPerfil: r.secure_url } });
        subidas++;
      } catch (e) {
        falhas++;
        console.error(`    FALHOU o upload de ${u.name}: ${e instanceof Error ? e.message : e} — User.image mantido`);
        continue; // não limpa: a base64 continua sendo a única cópia
      }
    }
  }

  if (!dry) {
    await users.updateOne({ _id: u._id }, { $set: { image: null } });
    limpas++;
  }
}

console.log(
  dry
    ? `\nSimulação: ${contas.length} contas; ${contas.length - semPerfil} com perfil. Rode sem --dry para executar.`
    : `\nFeito: ${subidas} foto(s) subida(s) para o Cloudinary, ${limpas} User.image limpo(s), ${falhas} falha(s) (mantidas como estavam).`
);
await cliente.close();
