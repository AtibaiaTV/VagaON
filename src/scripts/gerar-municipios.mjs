// Gera src/constants/municipios-ibge.ts a partir do CSV público de municípios
// brasileiros (kelvins/municipios-brasileiros, MIT): 5.570 cidades com
// código IBGE, UF e coordenadas do centro urbano.
//
//   curl -sSL -o /tmp/municipios.csv https://raw.githubusercontent.com/kelvins/municipios-brasileiros/main/csv/municipios.csv
//   node src/scripts/gerar-municipios.mjs /tmp/municipios.csv
//
// A chave é "UF:cidade normalizada", igual à tabela curada em municipios.ts,
// que continua tendo prioridade (ver MUNICIPIOS lá).

import { readFileSync, writeFileSync } from "node:fs";

const [, , caminhoCsv] = process.argv;
if (!caminhoCsv) {
  console.error("Uso: node src/scripts/gerar-municipios.mjs <municipios.csv>");
  process.exit(1);
}

// Mesma normalização de src/constants/municipios.ts (mantida em sincronia à mão).
function normalizarCidade(cidade) {
  return cidade
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[-']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const UF_POR_CODIGO = {
  11: "RO", 12: "AC", 13: "AM", 14: "RR", 15: "PA", 16: "AP", 17: "TO",
  21: "MA", 22: "PI", 23: "CE", 24: "RN", 25: "PB", 26: "PE", 27: "AL", 28: "SE", 29: "BA",
  31: "MG", 32: "ES", 33: "RJ", 35: "SP",
  41: "PR", 42: "SC", 43: "RS",
  50: "MS", 51: "MT", 52: "GO", 53: "DF",
};

const linhas = readFileSync(caminhoCsv, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
const cabecalho = linhas.shift().split(",");
const col = (nome) => cabecalho.indexOf(nome);
const iNome = col("nome"), iLat = col("latitude"), iLng = col("longitude"), iUf = col("codigo_uf");
if ([iNome, iLat, iLng, iUf].includes(-1)) {
  console.error("CSV sem as colunas esperadas (nome, latitude, longitude, codigo_uf).");
  process.exit(1);
}

const entradas = [];
const vistos = new Set();
for (const linha of linhas) {
  const c = linha.split(",");
  const uf = UF_POR_CODIGO[Number(c[iUf])];
  const nome = c[iNome];
  const lat = Number(c[iLat]);
  const lng = Number(c[iLng]);
  if (!uf || !nome || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
  const chave = `${uf}:${normalizarCidade(nome)}`;
  if (vistos.has(chave)) continue; // homônimos na mesma UF não existem no IBGE, mas por garantia
  vistos.add(chave);
  entradas.push([chave, lat.toFixed(4), lng.toFixed(4), nome.trim()]);
}
entradas.sort((a, b) => a[0].localeCompare(b[0]));

const saida =
  `/**\n` +
  ` * Coordenadas dos ${entradas.length} municípios brasileiros (centro urbano).\n` +
  ` * GERADO por src/scripts/gerar-municipios.mjs — não edite à mão; correções\n` +
  ` * pontuais vão na tabela curada de municipios.ts, que tem prioridade.\n` +
  ` *\n` +
  ` * Fonte: kelvins/municipios-brasileiros (dados do IBGE), licença MIT.\n` +
  ` */\n\n` +
  `import type { Coordenadas } from "./municipios";\n\n` +
  `export const MUNICIPIOS_IBGE: Record<string, Coordenadas> = {\n` +
  entradas.map(([k, lat, lng]) => `  ${JSON.stringify(k)}: { lat: ${lat}, lng: ${lng} },`).join("\n") +
  `\n};\n`;

writeFileSync("src/constants/municipios-ibge.ts", saida);
console.log(`${entradas.length} municípios → src/constants/municipios-ibge.ts (${(saida.length / 1024).toFixed(0)} KB)`);

// Nome de exibição (com acento e maiúsculas do IBGE) por chave — para o
// autopreenchimento de cidade. Só no servidor (GET /api/geo/cidades).
const nomes =
  "/**\n" +
  " * Nome oficial (com acentos) de cada município, pela mesma chave \"UF:nome\n" +
  " * normalizado\" de municipios-ibge.ts. GERADO por src/scripts/gerar-municipios.mjs.\n" +
  " * Usado só no servidor, pelo autopreenchimento de cidade.\n" +
  " */\n\n" +
  "export const NOMES_MUNICIPIOS: Record<string, string> = {\n" +
  entradas.map(([k, , , nome]) => `  ${JSON.stringify(k)}: ${JSON.stringify(nome)},`).join("\n") +
  "\n};\n";
writeFileSync("src/constants/municipios-nomes.ts", nomes);
console.log(`nomes → src/constants/municipios-nomes.ts (${(nomes.length / 1024).toFixed(0)} KB)`);
