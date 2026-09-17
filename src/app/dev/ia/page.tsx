import { notFound } from "next/navigation";
import { iaConfigurada } from "@/lib/ia/cliente";
import PlaygroundIA from "./PlaygroundIA";

/** Playground dos componentes de IA — sem banco. Só fora de produção. */
export default function IADevPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <PlaygroundIA iaConfigurada={iaConfigurada()} />;
}
