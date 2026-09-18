/** Idade em anos completos a partir da data de nascimento; null se não houver data válida. */
export function idadeDe(nascimento: unknown, hoje: Date = new Date()): number | null {
  if (!nascimento) return null;
  const d = new Date(nascimento as string);
  if (Number.isNaN(d.getTime())) return null;
  let idade = hoje.getUTCFullYear() - d.getUTCFullYear();
  const aniversarioPassou =
    hoje.getUTCMonth() > d.getUTCMonth() ||
    (hoje.getUTCMonth() === d.getUTCMonth() && hoje.getUTCDate() >= d.getUTCDate());
  if (!aniversarioPassou) idade--;
  return idade >= 0 && idade < 130 ? idade : null;
}

/** "12/03/1994". Vazio se não houver data válida. */
export function formatarNascimento(nascimento: unknown): string {
  if (!nascimento) return "";
  const d = new Date(nascimento as string);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

/** "12/03/1994 · 32 anos". */
export function nascimentoComIdade(nascimento: unknown): string {
  const data = formatarNascimento(nascimento);
  const idade = idadeDe(nascimento);
  return [data, idade !== null ? `${idade} anos` : ""].filter(Boolean).join(" · ");
}

/** Valor para <input type="date">: "1994-03-12". */
export function paraInputDate(nascimento: unknown): string {
  if (!nascimento) return "";
  const d = new Date(nascimento as string);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}
