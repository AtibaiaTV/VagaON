/** Percentual de preenchimento do perfil profissional — mesma régua em todo lugar. */
export function calcularCompletude(p: Record<string, unknown>): number {
  let pontos = 0;
  if (p.telefone) pontos += 10;
  if (p.fotoPerfil) pontos += 10;
  if (p.cidade && p.estado) pontos += 10;
  if (p.resumoProfissional) pontos += 15;
  if (Array.isArray(p.especialidades) && (p.especialidades as unknown[]).length > 0) pontos += 20;
  if (Array.isArray(p.experiencias) && (p.experiencias as unknown[]).length > 0) pontos += 20;
  const disponibilidade = p.disponibilidade as Record<string, unknown> | undefined;
  if (Array.isArray(disponibilidade?.tipo) && (disponibilidade!.tipo as unknown[]).length > 0) pontos += 15;
  return pontos;
}
