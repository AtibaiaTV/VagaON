import Link from "next/link";
import Logo from "@/components/layout/Logo";

export default function Footer() {
  return (
    <footer style={{ backgroundColor: "#1a5c38" }} className="text-white">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <div className="mb-4">
              <Logo size="md" variant="white" />
            </div>
            <p className="text-sm text-white/55 max-w-xs leading-relaxed">
              Conectando profissionais e empresas do setor gastronômico e hoteleiro em todo o Brasil.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-xs uppercase tracking-widest text-white/40">Profissionais</h4>
            <ul className="space-y-2.5 text-sm text-white/70">
              <li><Link href="/cadastro/profissional" className="hover:text-white transition-colors">Criar perfil grátis</Link></li>
              <li><Link href="/vagas" className="hover:text-white transition-colors">Ver vagas abertas</Link></li>
              <li><Link href="/entrar" className="hover:text-white transition-colors">Fazer login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-xs uppercase tracking-widest text-white/40">Empresas</h4>
            <ul className="space-y-2.5 text-sm text-white/70">
              <li><Link href="/cadastro/empresa" className="hover:text-white transition-colors">Cadastrar empresa</Link></li>
              <li><Link href="/vagas/nova" className="hover:text-white transition-colors">Publicar vaga</Link></li>
              <li><Link href="/entrar" className="hover:text-white transition-colors">Área da empresa</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/30">
          <span>© {new Date().getFullYear()} VagaON. Todos os direitos reservados.</span>
          <span>Gastronomia &amp; Hotelaria — Brasil</span>
        </div>
      </div>
    </footer>
  );
}
