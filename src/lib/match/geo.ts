import { MULTIPLICADOR_DISPOSTO_VIAJAR, RAIO_PADRAO_KM } from "@/constants/match";

const RAIO_TERRA_KM = 6371;

function rad(graus: number) {
  return (graus * Math.PI) / 180;
}

/** Distância em km entre dois pontos (Haversine). */
export function distanciaKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * RAIO_TERRA_KM * Math.asin(Math.sqrt(h)));
}

/**
 * Raio que o profissional realmente aceita: o declarado, ampliado quando ele
 * marcou disposição para viajar (muda de emprego de cidade, não de trajeto).
 */
export function raioEfetivoKm(raioKm: number | null | undefined, dispostoViajar: boolean): number {
  const base = raioKm && raioKm > 0 ? raioKm : RAIO_PADRAO_KM;
  return dispostoViajar ? base * MULTIPLICADOR_DISPOSTO_VIAJAR : base;
}

/** Fração do raio dentro da qual a distância não desconta nada. */
const PLATO = 0.25;

/**
 * Nota de 1 (perto) a 0 (no limite do raio).
 *
 * Até 25% do raio é "na sua região" e vale nota cheia — 10 km para quem aceita
 * 40 é trajeto normal, não um desconto. Daí em diante cai de forma quadrática:
 * metade do raio ≈ 0.89, 80% ≈ 0.46, no limite 0.
 */
export function notaDistancia(distancia: number, raioEfetivo: number): number {
  if (raioEfetivo <= 0) return 0;
  const razao = distancia / raioEfetivo;
  if (razao <= PLATO) return 1;
  if (razao >= 1) return 0;
  const alem = (razao - PLATO) / (1 - PLATO);
  return Math.max(0, 1 - alem * alem);
}

export interface PontoDoProfissional {
  coords: { lat: number; lng: number };
  /** null = a cidade onde mora; senão, o nome da cidade de interesse. */
  cidadeInteresse: string | null;
}

/**
 * Menor distância entre um alvo e qualquer ponto do profissional: a cidade
 * onde mora ou uma das cidades em que ele aceita trabalhar. Devolve também
 * qual ponto venceu, para a explicação ("a 12 km de Campos do Jordão").
 */
export function menorDistancia(
  pontos: PontoDoProfissional[],
  alvo: { lat: number; lng: number }
): { km: number; ponto: PontoDoProfissional } | null {
  let melhor: { km: number; ponto: PontoDoProfissional } | null = null;
  for (const ponto of pontos) {
    const km = distanciaKm(ponto.coords, alvo);
    if (!melhor || km < melhor.km) melhor = { km, ponto };
  }
  return melhor;
}

/** Converte GeoJSON [lng, lat] do Mongo para o formato usado no motor. */
export function paraCoords(
  localizacao: { coordinates?: number[] | null } | null | undefined
): { lat: number; lng: number } | null {
  const c = localizacao?.coordinates;
  if (!Array.isArray(c) || c.length !== 2) return null;
  const [lng, lat] = c;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}
