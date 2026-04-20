import { UtensilsCrossed, BedDouble, CalendarDays } from "lucide-react";

const setores = [
  {
    icone: UtensilsCrossed,
    nome: "Estabelecimentos Gastronômicos",
    descricao: "Restaurantes, bares, lanchonetes, cafés e muito mais",
  },
  {
    icone: BedDouble,
    nome: "Hotelaria",
    descricao: "Hotéis, pousadas, resorts e apart-hotéis",
  },
  {
    icone: CalendarDays,
    nome: "Eventos",
    descricao: "Casamentos, aniversários, feiras e eventos",
  },
];

export default function Especialidades() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            Onde você vai trabalhar
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Conectamos profissionais aos melhores estabelecimentos do setor de gastronomia, hospitalidade e de eventos.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {setores.map((setor) => (
            <div
              key={setor.nome}
              className="group rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-default"
            >
              {/* Topo — verde médio com ícone */}
              <div
                className="relative overflow-hidden flex items-center justify-center py-12"
                style={{ backgroundColor: "#1a5c38" }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.06] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/[0.06] rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
                <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <setor.icone className="h-8 w-8 text-white" strokeWidth={1.5} />
                </div>
              </div>

              {/* Base — verde escuro com título e descrição */}
              <div
                className="px-5 py-5 text-center"
                style={{ backgroundColor: "#143f28" }}
              >
                <p className="text-base font-semibold text-white leading-snug mb-1.5">
                  {setor.nome}
                </p>
                <p className="text-xs text-white/60 leading-relaxed">
                  {setor.descricao}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
