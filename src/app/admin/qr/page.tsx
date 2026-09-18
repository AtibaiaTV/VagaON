import { connectDB } from "@/lib/db";
import { DESTINOS_QR, baseDoSite } from "@/lib/qr";
import User from "@/models/User";
import GeradorQr from "./GeradorQr";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

/** QR Codes e links de entrada rápida, com cadastros por origem para medir cada material. */
export default async function AdminQrPage() {
  await connectDB();
  const base = baseDoSite();
  const ehBaseLocal = /localhost|127\.0\.0\.1/.test(base);
  const linhas = (await User.aggregate([
    { $match: { origemCadastro: { $ne: null } } },
    { $group: { _id: { origem: "$origemCadastro", role: "$role" }, n: { $sum: 1 } } },
    { $sort: { n: -1 } },
  ])) as { _id: { origem: string; role: string }; n: number }[];

  const porOrigem = new Map<string, { profissionais: number; empresas: number }>();
  for (const l of linhas) {
    const atual = porOrigem.get(l._id.origem) ?? { profissionais: 0, empresas: 0 };
    if (l._id.role === "profissional") atual.profissionais += l.n;
    if (l._id.role === "empresa") atual.empresas += l.n;
    porOrigem.set(l._id.origem, atual);
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">QR Codes e links de entrada</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Cada QR leva a um cadastro de 1 minuto. A etiqueta de origem (cartaz, balcão, Instagram…) mostra de onde vêm os
          cadastros. Links funcionam igual, para WhatsApp e redes.
        </p>
      </div>

      {ehBaseLocal && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900">
            <p className="font-semibold">Os QR Codes abaixo apontam para {base}</p>
            <p className="mt-0.5 text-amber-900/80">
              Impressos assim, não abrem no celular de ninguém. Defina <code>NEXT_PUBLIC_APP_URL</code> com o domínio
              real e faça um novo deploy antes de imprimir cartaz ou adesivo.{" "}
              <Link href="/admin/diagnostico" className="font-semibold underline underline-offset-2">
                Diagnóstico
              </Link>
            </p>
          </div>
        </div>
      )}

      <GeradorQr base={base} destinos={DESTINOS_QR} />

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">Cadastros por origem</h2>
        {porOrigem.size === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum cadastro com origem ainda. Distribua um QR ou link com etiqueta.</p>
        ) : (
          <table className="text-sm bg-white rounded-xl border overflow-hidden">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2 font-semibold">Origem</th>
                <th className="px-4 py-2 font-semibold">Profissionais</th>
                <th className="px-4 py-2 font-semibold">Empresas</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(porOrigem.entries()).map(([origem, n]) => (
                <tr key={origem} className="border-t">
                  <td className="px-4 py-2 font-mono text-xs">{origem}</td>
                  <td className="px-4 py-2">{n.profissionais}</td>
                  <td className="px-4 py-2">{n.empresas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
