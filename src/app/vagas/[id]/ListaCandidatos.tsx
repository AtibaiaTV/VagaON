"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users } from "lucide-react";
import { ESPECIALIDADES } from "@/constants/especialidades";

interface Candidato {
  _id: string;
  status: string;
  mensagem: string | null;
  createdAt: string;
  snapshotProfissional: {
    nomeCompleto: string;
    especialidades: string[];
    cidade: string;
    estado: string;
  };
}

const STATUS_LABEL: Record<string, string> = {
  enviada: "Enviada",
  visualizada: "Visualizada",
  em_analise: "Em análise",
  aprovada: "Aprovada",
  recusada: "Recusada",
};

const STATUS_COR: Record<string, string> = {
  enviada: "bg-blue-100 text-blue-700",
  visualizada: "bg-gray-100 text-gray-700",
  em_analise: "bg-yellow-100 text-yellow-700",
  aprovada: "bg-green-100 text-green-700",
  recusada: "bg-red-100 text-red-700",
};

export default function ListaCandidatos({ candidatos: inicial, vagaId }: { candidatos: Candidato[]; vagaId: string }) {
  const [candidatos, setCandidatos] = useState<Candidato[]>(inicial);
  const [atualizando, setAtualizando] = useState<string | null>(null);

  async function atualizarStatus(candidaturaId: string, novoStatus: string) {
    setAtualizando(candidaturaId);

    const res = await fetch(`/api/candidaturas/${candidaturaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus }),
    });

    setAtualizando(null);

    if (res.ok) {
      setCandidatos((prev) =>
        prev.map((c) => (c._id === candidaturaId ? { ...c, status: novoStatus } : c))
      );
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" />
          Candidatos ({candidatos.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {candidatos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum candidato ainda.
          </p>
        ) : (
          <div className="space-y-4">
            {candidatos.map((c) => (
              <div key={c._id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{c.snapshotProfissional.nomeCompleto}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {c.snapshotProfissional.especialidades.slice(0, 3).map((e) => (
                        <Badge key={e} variant="secondary" className="text-xs">
                          {ESPECIALIDADES.find((esp) => esp.value === e)?.label ?? e}
                        </Badge>
                      ))}
                    </div>
                    {(c.snapshotProfissional.cidade || c.snapshotProfissional.estado) && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {[c.snapshotProfissional.cidade, c.snapshotProfissional.estado].filter(Boolean).join(", ")}
                      </p>
                    )}
                    {c.mensagem && (
                      <p className="text-xs text-muted-foreground mt-2 italic">&ldquo;{c.mensagem}&rdquo;</p>
                    )}
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${STATUS_COR[c.status]}`}>
                    {STATUS_LABEL[c.status]}
                  </span>
                </div>

                {/* Ações */}
                {c.status !== "aprovada" && c.status !== "recusada" && (
                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    <Button
                      size="sm" variant="outline"
                      className="text-green-600 border-green-200 hover:bg-green-50"
                      disabled={atualizando === c._id}
                      onClick={() => atualizarStatus(c._id, "aprovada")}
                    >
                      Aprovar
                    </Button>
                    <Button
                      size="sm" variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      disabled={atualizando === c._id}
                      onClick={() => atualizarStatus(c._id, "recusada")}
                    >
                      Recusar
                    </Button>
                    {c.status === "enviada" && (
                      <Button
                        size="sm" variant="ghost"
                        disabled={atualizando === c._id}
                        onClick={() => atualizarStatus(c._id, "em_analise")}
                      >
                        Em análise
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
