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

  const token = authHeader.slice(7);
  const secret = process.env.CROSS_PLATFORM_SECRET;

  if (!secret) throw new Error("CROSS_PLATFORM_SECRET não configurado");

  const payload = jwt.verify(token, secret) as CrossPlatformPayload;

  if (payload.type !== "cross-platform") {
    throw new Error("Token inválido");
  }

  return payload;
}
