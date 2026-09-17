import { NextRequest, NextResponse } from "next/server";
import { resolverAtor } from "@/lib/servicos/ator";
import { icsDaEntrevista } from "@/lib/servicos/entrevistas";
import { responderErro } from "@/lib/servicos/http";

export const dynamic = "force-dynamic";

// GET /api/matches/[id]/entrevista/ics — arquivo de calendário da entrevista confirmada
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ator = await resolverAtor();
    const ics = await icsDaEntrevista(ator, params.id);
    return new NextResponse(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="entrevista-vagaon.ics"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return responderErro(err);
  }
}
