import jwt from "jsonwebtoken";

export interface CrossPlatformPayload {
  sub: string;
  establishmentId: string;
  establishmentName: string;
  category?: string;
  city?: string;
  state: string;
  email?: string;
  phone?: string;
  type: "cross-platform";
}

export function verifyCrossPlatformToken(authHeader: string | null): CrossPlatformPayload {
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Token não fornecido");
  }
  return verificarTokenCrossPlatform(authHeader.slice(7));
}

/**
 * Verifica o token em si (sem o cabeçalho). `maxAge` limita a idade contada a
 * partir do `iat`, para o caso de o emissor esquecer o `exp`: no SSO o token
 * sai do backoffice e passa pelo navegador, então precisa de vida curta.
 */
export function verificarTokenCrossPlatform(
  token: string,
  opcoes: { maxAge?: string } = {}
): CrossPlatformPayload {
  const secret = process.env.CROSS_PLATFORM_SECRET;

  if (!secret) throw new Error("CROSS_PLATFORM_SECRET não configurado");

  const payload = jwt.verify(token, secret, { maxAge: opcoes.maxAge }) as CrossPlatformPayload;

  if (payload.type !== "cross-platform") {
    throw new Error("Token inválido");
  }

  return payload;
}
