import {
  UtensilsCrossed,
  ChefHat,
  GlassWater,
  Cake,
  Flame,
  Fish,
  Coffee,
  ConciergeBell,
  Wine,
  Star,
  BedDouble,
  CalendarDays,
} from "lucide-react";

const especialidades = [
  { icone: UtensilsCrossed, nome: "Garçom / Garçonete" },
  { icone: ChefHat,         nome: "Cozinheiro(a)"      },
  { icone: GlassWater,      nome: "Barman / Bartender"  },
  { icone: Cake,            nome: "Confeiteiro(a)"      },
  { icone: Flame,           nome: "Pizzaiolo"           },
  { icone: Fish,            nome: "Sushiman"            },
  { icone: Coffee,          nome: "Barista"             },
  { icone: ConciergeBell,   nome: "Recepcionista"       },
  { icone: Wine,            nome: "Sommelier"           },
  { icone: Star,            nome: "Chefe de Cozinha"    },
  { icone: BedDouble,       nome: "Camareira"           },
  { icone: CalendarDays,    nome: "Eventos / Buffet"    },
];

export default function Especialidades() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            Profissionais de todos os setores
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Do salão à cozinha, do bar à recepção — conectamos todos os talentos da hospitalidade.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {especialidades.map((esp) => (
            <div
              key={esp.nome}
              className="group rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default"
            >
              {/* Topo — verde médio com ícone branco */}
              <div
                className="flex items-center justify-center py-7"
                style={{ backgroundColor: "#1a5c38" }}
              >
                <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <esp.icone className="h-6 w-6 text-white" strokeWidth={1.75} />
                </div>
              </div>

              {/* Base — verde escuro com texto branco */}
              <div
                className="px-3 py-3 text-center"
                style={{ backgroundColor: "#143f28" }}
              >
                <p className="text-sm font-medium text-white leading-tight">{esp.nome}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
