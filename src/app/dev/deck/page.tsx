import { notFound } from "next/navigation";
import DeckPreview from "./DeckPreview";

/**
 * Playground do deck com dados mockados — sem banco, sem login.
 * Só existe fora de produção. Útil para iterar no visual dos cards e nos gestos.
 *   /dev/deck               → deck do profissional (vagas)
 *   /dev/deck?modo=empresa  → deck da empresa (candidatos)
 */
export default function DeckDevPage({ searchParams }: { searchParams: { modo?: string } }) {
  if (process.env.NODE_ENV === "production") notFound();
  return <DeckPreview modo={searchParams.modo === "empresa" ? "empresa" : "profissional"} />;
}
