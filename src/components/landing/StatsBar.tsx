const stats = [
  { valor: "100%", rotulo: "Gratuito para profissionais" },
  { valor: "CLT · Temporário · Sazonal", rotulo: "Tipos de contrato" },
  { valor: "24h", rotulo: "Para receber candidatos" },
  { valor: "Todo o Brasil", rotulo: "Cobertura nacional" },
];

export default function StatsBar() {
  return (
    <section className="relative overflow-hidden bg-[#143f28] py-10 border-t border-white/5">
      {/* Meias-luas decorativas */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.04] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-44 h-44 bg-white/[0.04] rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.rotulo} className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-white mb-1 whitespace-nowrap">
                {s.valor}
              </p>
              <p className="text-xs text-white/40 leading-tight">{s.rotulo}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
