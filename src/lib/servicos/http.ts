import { NextResponse } from "next/server";
import { ErroAtor } from "./ator";

/** Converte erros de serviço em resposta HTTP; o resto vira 500 genérico. */
export function responderErro(err: unknown) {
  if (err instanceof ErroAtor) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error("[match]", err);
  return NextResponse.json({ error: "Erro interno." }, { status: 500 });
}
