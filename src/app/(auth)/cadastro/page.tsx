import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChefHat, Building2 } from "lucide-react";

export default function CadastroPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary">VagaON</h1>
          <p className="text-muted-foreground text-sm mt-1">Gastronomia &amp; Hotelaria</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Criar conta</CardTitle>
            <CardDescription>
              Como você vai usar a plataforma?
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Link href="/cadastro/profissional">
              <Button
                variant="outline"
                className="w-full h-auto py-5 flex items-start gap-4 text-left hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <ChefHat className="h-8 w-8 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-base">Sou Profissional</p>
                  <p className="text-sm text-muted-foreground font-normal mt-0.5">
                    Quero encontrar vagas como garçom, cozinheiro, barman,
                    recepcionista e muito mais.
                  </p>
                </div>
              </Button>
            </Link>

            <Link href="/cadastro/empresa">
              <Button
                variant="outline"
                className="w-full h-auto py-5 flex items-start gap-4 text-left hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <Building2 className="h-8 w-8 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-base">Sou Empresa</p>
                  <p className="text-sm text-muted-foreground font-normal mt-0.5">
                    Quero publicar vagas e encontrar profissionais para meu
                    restaurante, hotel, bar ou evento.
                  </p>
                </div>
              </Button>
            </Link>

            <p className="text-sm text-muted-foreground text-center pt-2">
              Já tem conta?{" "}
              <Link href="/entrar" className="text-primary hover:underline font-medium">
                Entrar
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
