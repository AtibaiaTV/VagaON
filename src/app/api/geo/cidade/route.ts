import { NextRequest, NextResponse } from "next/server";
import { geocodificarCidade } from "@/constants/municipios";

/**
 * GET /api/geo/cidade?cidade=Campos do Jordão&uf=SP
 *
 * Diz se a cidade existe na tabela de municípios (e devolve as coordenadas).
 * Usado pelo formulário de perfil ao adicionar uma cidade de interesse: a
 * tabela tem 300 KB e fica só no servidor. Sem UF, resolve quando o nome é
 * único no país.
 */
export async function GET(req: NextRequest) {
  const cidade = (req.nextUrl.searchParams.get("cidade") ?? "").trim().slice(0, 80);
  const uf = (req.nextUrl.searchParams.get("uf") ?? "").trim().toUpperCase().slice(0, 2);
  if (!cidade) return NextResponse.json({ error: "Informe a cidade." }, { status: 400 });

  const coords = geocodificarCidade(cidade, uf || null);
  if (!coords) {
    return NextResponse.json(
      { error: uf ? `Não encontrei "${cidade}" em ${uf}. Confira a grafia.` : `Informe a UF de "${cidade}".` },
      { status: 404 }
    );
  }
  return NextResponse.json({ cidade, uf, lat: coords.lat, lng: coords.lng });
}
