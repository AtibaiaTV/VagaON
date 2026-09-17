/** Erro de serviço com status HTTP. Vive separado de `ator.ts` para que os serviços possam ser usados fora do Next (scripts, testes). */
export class ErroAtor extends Error {
  status: number;

  constructor(status: number, mensagem: string) {
    super(mensagem);
    this.status = status;
  }
}
