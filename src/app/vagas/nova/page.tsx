import { iaConfigurada } from "@/lib/ia/cliente";
import FormNovaVaga from "./FormNovaVaga";

export const dynamic = "force-dynamic";

export default function NovaVagaPage() {
  return <FormNovaVaga iaDisponivel={iaConfigurada()} />;
}
