/**
 * Coordenadas de municípios para cálculo de distância no motor de match.
 *
 * Cobertura: as 27 capitais + ~150 cidades com peso no setor (regiões
 * metropolitanas e destinos de gastronomia/hotelaria/eventos). Cidade não
 * listada cai no centroide do estado — o match continua funcionando, só com
 * precisão menor.
 *
 * Para cobertura completa dos 5.570 municípios, substitua MUNICIPIOS pela base
 * do IBGE (malha municipal) mantendo o mesmo formato "UF:cidade-normalizada".
 */

export interface Coordenadas {
  lat: number;
  lng: number;
}

/** Centroide aproximado de cada UF — usado quando a cidade não está mapeada. */
export const CENTROIDES_UF: Record<string, Coordenadas> = {
  AC: { lat: -9.0, lng: -70.0 },
  AL: { lat: -9.6, lng: -36.6 },
  AP: { lat: 1.4, lng: -51.8 },
  AM: { lat: -4.2, lng: -63.5 },
  BA: { lat: -12.5, lng: -41.7 },
  CE: { lat: -5.2, lng: -39.6 },
  DF: { lat: -15.78, lng: -47.93 },
  ES: { lat: -19.6, lng: -40.7 },
  GO: { lat: -16.0, lng: -49.5 },
  MA: { lat: -5.0, lng: -45.3 },
  MT: { lat: -13.0, lng: -55.9 },
  MS: { lat: -20.5, lng: -54.5 },
  MG: { lat: -18.6, lng: -44.6 },
  PA: { lat: -4.0, lng: -53.0 },
  PB: { lat: -7.2, lng: -36.7 },
  PR: { lat: -24.6, lng: -51.6 },
  PE: { lat: -8.4, lng: -37.6 },
  PI: { lat: -7.4, lng: -42.5 },
  RJ: { lat: -22.2, lng: -42.7 },
  RN: { lat: -5.8, lng: -36.6 },
  RS: { lat: -29.7, lng: -53.2 },
  RO: { lat: -11.0, lng: -63.0 },
  RR: { lat: 2.1, lng: -61.3 },
  SC: { lat: -27.3, lng: -50.5 },
  SP: { lat: -22.2, lng: -48.7 },
  SE: { lat: -10.6, lng: -37.4 },
  TO: { lat: -10.2, lng: -48.3 },
};

/** Chave: "UF:cidade" com a cidade já normalizada (minúscula, sem acento). */
export const MUNICIPIOS: Record<string, Coordenadas> = {
  // ─── Capitais ──────────────────────────────────────────────────────────────
  "AC:rio branco": { lat: -9.97, lng: -67.81 },
  "AL:maceio": { lat: -9.67, lng: -35.73 },
  "AP:macapa": { lat: 0.03, lng: -51.07 },
  "AM:manaus": { lat: -3.12, lng: -60.02 },
  "BA:salvador": { lat: -12.97, lng: -38.5 },
  "CE:fortaleza": { lat: -3.73, lng: -38.52 },
  "DF:brasilia": { lat: -15.79, lng: -47.88 },
  "ES:vitoria": { lat: -20.32, lng: -40.34 },
  "GO:goiania": { lat: -16.68, lng: -49.25 },
  "MA:sao luis": { lat: -2.53, lng: -44.3 },
  "MT:cuiaba": { lat: -15.6, lng: -56.1 },
  "MS:campo grande": { lat: -20.44, lng: -54.65 },
  "MG:belo horizonte": { lat: -19.92, lng: -43.94 },
  "PA:belem": { lat: -1.46, lng: -48.5 },
  "PB:joao pessoa": { lat: -7.12, lng: -34.88 },
  "PR:curitiba": { lat: -25.43, lng: -49.27 },
  "PE:recife": { lat: -8.05, lng: -34.88 },
  "PI:teresina": { lat: -5.09, lng: -42.8 },
  "RJ:rio de janeiro": { lat: -22.91, lng: -43.17 },
  "RN:natal": { lat: -5.79, lng: -35.21 },
  "RS:porto alegre": { lat: -30.03, lng: -51.23 },
  "RO:porto velho": { lat: -8.76, lng: -63.9 },
  "RR:boa vista": { lat: 2.82, lng: -60.67 },
  "SC:florianopolis": { lat: -27.59, lng: -48.55 },
  "SP:sao paulo": { lat: -23.55, lng: -46.63 },
  "SE:aracaju": { lat: -10.91, lng: -37.07 },
  "TO:palmas": { lat: -10.18, lng: -48.33 },

  // ─── São Paulo ─────────────────────────────────────────────────────────────
  "SP:campinas": { lat: -22.91, lng: -47.06 },
  "SP:santos": { lat: -23.96, lng: -46.33 },
  "SP:guarulhos": { lat: -23.45, lng: -46.53 },
  "SP:sao bernardo do campo": { lat: -23.69, lng: -46.56 },
  "SP:santo andre": { lat: -23.66, lng: -46.53 },
  "SP:sao caetano do sul": { lat: -23.62, lng: -46.56 },
  "SP:diadema": { lat: -23.69, lng: -46.62 },
  "SP:osasco": { lat: -23.53, lng: -46.79 },
  "SP:barueri": { lat: -23.51, lng: -46.88 },
  "SP:cotia": { lat: -23.6, lng: -46.92 },
  "SP:ribeirao preto": { lat: -21.18, lng: -47.81 },
  "SP:sorocaba": { lat: -23.5, lng: -47.46 },
  "SP:sao jose dos campos": { lat: -23.18, lng: -45.89 },
  "SP:jundiai": { lat: -23.19, lng: -46.88 },
  "SP:piracicaba": { lat: -22.72, lng: -47.65 },
  "SP:bauru": { lat: -22.31, lng: -49.06 },
  "SP:sao jose do rio preto": { lat: -20.81, lng: -49.38 },
  "SP:atibaia": { lat: -23.12, lng: -46.55 },
  "SP:braganca paulista": { lat: -22.95, lng: -46.54 },
  "SP:campos do jordao": { lat: -22.74, lng: -45.59 },
  "SP:ubatuba": { lat: -23.43, lng: -45.07 },
  "SP:ilhabela": { lat: -23.78, lng: -45.36 },
  "SP:sao sebastiao": { lat: -23.76, lng: -45.41 },
  "SP:caraguatatuba": { lat: -23.62, lng: -45.41 },
  "SP:guaruja": { lat: -23.99, lng: -46.26 },
  "SP:bertioga": { lat: -23.85, lng: -46.14 },
  "SP:praia grande": { lat: -24.01, lng: -46.41 },
  "SP:sao vicente": { lat: -23.96, lng: -46.39 },
  "SP:serra negra": { lat: -22.61, lng: -46.7 },
  "SP:aguas de lindoia": { lat: -22.47, lng: -46.63 },
  "SP:holambra": { lat: -22.63, lng: -47.05 },
  "SP:olimpia": { lat: -20.74, lng: -48.91 },
  "SP:aguas de sao pedro": { lat: -22.6, lng: -47.87 },
  "SP:mogi das cruzes": { lat: -23.52, lng: -46.19 },
  "SP:limeira": { lat: -22.56, lng: -47.4 },
  "SP:americana": { lat: -22.74, lng: -47.33 },
  "SP:indaiatuba": { lat: -23.09, lng: -47.22 },
  "SP:taubate": { lat: -23.03, lng: -45.56 },

  // ─── SP: região de Atibaia / Bragança / Jundiaí / Campinas ─────────────────
  "SP:jarinu": { lat: -23.1, lng: -46.73 },
  "SP:bom jesus dos perdoes": { lat: -23.13, lng: -46.47 },
  "SP:nazare paulista": { lat: -23.18, lng: -46.4 },
  "SP:piracaia": { lat: -23.05, lng: -46.36 },
  "SP:joanopolis": { lat: -22.93, lng: -46.28 },
  "SP:vargem": { lat: -22.89, lng: -46.41 },
  "SP:pinhalzinho": { lat: -22.78, lng: -46.59 },
  "SP:tuiuti": { lat: -22.82, lng: -46.69 },
  "SP:morungaba": { lat: -22.88, lng: -46.79 },
  "SP:itatiba": { lat: -23.0, lng: -46.84 },
  "SP:mairipora": { lat: -23.32, lng: -46.59 },
  "SP:franco da rocha": { lat: -23.33, lng: -46.73 },
  "SP:francisco morato": { lat: -23.28, lng: -46.75 },
  "SP:caieiras": { lat: -23.36, lng: -46.74 },
  "SP:cajamar": { lat: -23.36, lng: -46.88 },
  "SP:campo limpo paulista": { lat: -23.21, lng: -46.78 },
  "SP:varzea paulista": { lat: -23.21, lng: -46.83 },
  "SP:louveira": { lat: -23.09, lng: -46.95 },
  "SP:vinhedo": { lat: -23.03, lng: -46.98 },
  "SP:valinhos": { lat: -22.97, lng: -46.99 },
  "SP:itupeva": { lat: -23.15, lng: -47.06 },
  "SP:cabreuva": { lat: -23.31, lng: -47.13 },
  "SP:jaguariuna": { lat: -22.7, lng: -46.98 },
  "SP:pedreira": { lat: -22.74, lng: -46.9 },
  "SP:amparo": { lat: -22.7, lng: -46.77 },
  "SP:socorro": { lat: -22.59, lng: -46.53 },
  "SP:lindoia": { lat: -22.52, lng: -46.65 },
  "SP:monte alegre do sul": { lat: -22.68, lng: -46.68 },
  "SP:paulinia": { lat: -22.76, lng: -47.15 },
  "SP:hortolandia": { lat: -22.86, lng: -47.22 },
  "SP:sumare": { lat: -22.82, lng: -47.27 },
  "SP:cosmopolis": { lat: -22.65, lng: -47.2 },
  "SP:mogi mirim": { lat: -22.43, lng: -46.96 },
  "SP:mogi guacu": { lat: -22.37, lng: -46.94 },

  // ─── SP: Grande São Paulo e interior ───────────────────────────────────────
  "SP:embu das artes": { lat: -23.65, lng: -46.85 },
  "SP:itapecerica da serra": { lat: -23.72, lng: -46.85 },
  "SP:taboao da serra": { lat: -23.63, lng: -46.79 },
  "SP:carapicuiba": { lat: -23.52, lng: -46.84 },
  "SP:jandira": { lat: -23.53, lng: -46.9 },
  "SP:itapevi": { lat: -23.55, lng: -46.93 },
  "SP:santana de parnaiba": { lat: -23.44, lng: -46.92 },
  "SP:maua": { lat: -23.67, lng: -46.46 },
  "SP:ribeirao pires": { lat: -23.71, lng: -46.41 },
  "SP:suzano": { lat: -23.54, lng: -46.31 },
  "SP:poa": { lat: -23.53, lng: -46.34 },
  "SP:itaquaquecetuba": { lat: -23.49, lng: -46.35 },
  "SP:aruja": { lat: -23.4, lng: -46.32 },
  "SP:guararema": { lat: -23.41, lng: -46.04 },
  "SP:jacarei": { lat: -23.31, lng: -45.97 },
  "SP:cacapava": { lat: -23.1, lng: -45.71 },
  "SP:pindamonhangaba": { lat: -22.92, lng: -45.46 },
  "SP:guaratingueta": { lat: -22.82, lng: -45.19 },
  "SP:lorena": { lat: -22.73, lng: -45.12 },
  "SP:aparecida": { lat: -22.85, lng: -45.23 },
  "SP:cunha": { lat: -23.07, lng: -44.96 },
  "SP:sao luiz do paraitinga": { lat: -23.22, lng: -45.31 },
  "SP:santo antonio do pinhal": { lat: -22.83, lng: -45.66 },
  "SP:sao bento do sapucai": { lat: -22.69, lng: -45.73 },
  "SP:itu": { lat: -23.26, lng: -47.3 },
  "SP:salto": { lat: -23.2, lng: -47.29 },
  "SP:porto feliz": { lat: -23.21, lng: -47.52 },
  "SP:boituva": { lat: -23.28, lng: -47.67 },
  "SP:tatui": { lat: -23.35, lng: -47.85 },
  "SP:votorantim": { lat: -23.55, lng: -47.44 },
  "SP:itapetininga": { lat: -23.59, lng: -48.05 },
  "SP:sao roque": { lat: -23.53, lng: -47.14 },
  "SP:mairinque": { lat: -23.55, lng: -47.18 },
  "SP:ibiuna": { lat: -23.66, lng: -47.22 },
  "SP:piedade": { lat: -23.71, lng: -47.43 },
  "SP:jau": { lat: -22.3, lng: -48.56 },
  "SP:araraquara": { lat: -21.79, lng: -48.18 },
  "SP:sao carlos": { lat: -22.02, lng: -47.89 },
  "SP:brotas": { lat: -22.28, lng: -48.13 },
  "SP:botucatu": { lat: -22.89, lng: -48.44 },
  "SP:avare": { lat: -23.1, lng: -48.93 },
  "SP:marilia": { lat: -22.21, lng: -49.95 },
  "SP:presidente prudente": { lat: -22.12, lng: -51.39 },
  "SP:franca": { lat: -20.54, lng: -47.4 },
  "SP:barretos": { lat: -20.55, lng: -48.57 },
  "SP:assis": { lat: -22.66, lng: -50.41 },
  "SP:ourinhos": { lat: -22.98, lng: -49.87 },
  "SP:lins": { lat: -21.68, lng: -49.75 },
  "SP:cubatao": { lat: -23.89, lng: -46.42 },
  "SP:mongagua": { lat: -24.09, lng: -46.63 },
  "SP:itanhaem": { lat: -24.18, lng: -46.79 },
  "SP:peruibe": { lat: -24.32, lng: -47.0 },
  "SP:registro": { lat: -24.49, lng: -47.84 },
  "SP:ilha comprida": { lat: -24.73, lng: -47.55 },
  "SP:cananeia": { lat: -25.01, lng: -47.93 },

  // ─── Rio de Janeiro ────────────────────────────────────────────────────────
  "RJ:niteroi": { lat: -22.88, lng: -43.1 },
  "RJ:duque de caxias": { lat: -22.79, lng: -43.31 },
  "RJ:nova iguacu": { lat: -22.76, lng: -43.45 },
  "RJ:sao goncalo": { lat: -22.83, lng: -43.05 },
  "RJ:petropolis": { lat: -22.51, lng: -43.18 },
  "RJ:teresopolis": { lat: -22.41, lng: -42.97 },
  "RJ:nova friburgo": { lat: -22.28, lng: -42.53 },
  "RJ:angra dos reis": { lat: -23.01, lng: -44.32 },
  "RJ:paraty": { lat: -23.22, lng: -44.71 },
  "RJ:armacao dos buzios": { lat: -22.75, lng: -41.88 },
  "RJ:cabo frio": { lat: -22.88, lng: -42.02 },
  "RJ:arraial do cabo": { lat: -22.97, lng: -42.03 },
  "RJ:marica": { lat: -22.92, lng: -42.82 },
  "RJ:macae": { lat: -22.37, lng: -41.79 },
  "RJ:campos dos goytacazes": { lat: -21.75, lng: -41.33 },
  "RJ:resende": { lat: -22.47, lng: -44.45 },
  "RJ:itatiaia": { lat: -22.5, lng: -44.56 },
  "RJ:volta redonda": { lat: -22.52, lng: -44.1 },
  "RJ:barra mansa": { lat: -22.54, lng: -44.17 },
  "RJ:barra do pirai": { lat: -22.47, lng: -43.83 },
  "RJ:pirai": { lat: -22.63, lng: -43.9 },
  "RJ:belford roxo": { lat: -22.76, lng: -43.4 },
  "RJ:nilopolis": { lat: -22.81, lng: -43.41 },
  "RJ:sao joao de meriti": { lat: -22.8, lng: -43.37 },
  "RJ:mesquita": { lat: -22.78, lng: -43.43 },
  "RJ:queimados": { lat: -22.71, lng: -43.55 },
  "RJ:mage": { lat: -22.65, lng: -43.04 },
  "RJ:guapimirim": { lat: -22.54, lng: -42.98 },
  "RJ:itaborai": { lat: -22.74, lng: -42.86 },
  "RJ:rio bonito": { lat: -22.72, lng: -42.62 },
  "RJ:mangaratiba": { lat: -22.96, lng: -44.04 },
  "RJ:conceicao de jacarei": { lat: -22.99, lng: -44.06 }, // distrito de Mangaratiba
  "RJ:saquarema": { lat: -22.92, lng: -42.51 },
  "RJ:araruama": { lat: -22.87, lng: -42.34 },
  "RJ:iguaba grande": { lat: -22.84, lng: -42.23 },
  "RJ:sao pedro da aldeia": { lat: -22.84, lng: -42.1 },
  "RJ:rio das ostras": { lat: -22.53, lng: -41.95 },
  "RJ:casimiro de abreu": { lat: -22.48, lng: -42.2 },
  "RJ:miguel pereira": { lat: -22.45, lng: -43.47 },
  "RJ:vassouras": { lat: -22.4, lng: -43.66 },
  "RJ:valenca": { lat: -22.25, lng: -43.7 },
  "RJ:tres rios": { lat: -22.12, lng: -43.21 },
  "RJ:itaperuna": { lat: -21.2, lng: -41.89 },

  // ─── Minas Gerais ──────────────────────────────────────────────────────────
  "MG:uberlandia": { lat: -18.92, lng: -48.28 },
  "MG:contagem": { lat: -19.93, lng: -44.05 },
  "MG:betim": { lat: -19.97, lng: -44.2 },
  "MG:nova lima": { lat: -19.99, lng: -43.85 },
  "MG:juiz de fora": { lat: -21.76, lng: -43.35 },
  "MG:montes claros": { lat: -16.73, lng: -43.86 },
  "MG:uberaba": { lat: -19.75, lng: -47.93 },
  "MG:ouro preto": { lat: -20.39, lng: -43.51 },
  "MG:tiradentes": { lat: -21.11, lng: -44.18 },
  "MG:sao joao del rei": { lat: -21.14, lng: -44.26 },
  "MG:pocos de caldas": { lat: -21.79, lng: -46.56 },
  "MG:araxa": { lat: -19.59, lng: -46.94 },
  "MG:capitolio": { lat: -20.61, lng: -46.05 },
  "MG:diamantina": { lat: -18.24, lng: -43.6 },
  "MG:camanducaia": { lat: -22.76, lng: -46.14 },
  "MG:tres coracoes": { lat: -21.69, lng: -45.25 },
  "MG:ipatinga": { lat: -19.47, lng: -42.54 },
  // Sul de Minas (divisa com Atibaia/Bragança) e Circuito das Águas
  "MG:extrema": { lat: -22.85, lng: -46.32 },
  "MG:itapeva": { lat: -22.77, lng: -46.22 },
  "MG:toledo": { lat: -22.74, lng: -46.37 },
  "MG:cambui": { lat: -22.61, lng: -46.06 },
  "MG:pouso alegre": { lat: -22.23, lng: -45.94 },
  "MG:itajuba": { lat: -22.42, lng: -45.45 },
  "MG:goncalves": { lat: -22.66, lng: -45.86 },
  "MG:sapucai mirim": { lat: -22.74, lng: -45.74 },
  "MG:monte siao": { lat: -22.43, lng: -46.57 },
  "MG:jacutinga": { lat: -22.29, lng: -46.61 },
  "MG:ouro fino": { lat: -22.28, lng: -46.37 },
  "MG:andradas": { lat: -22.07, lng: -46.57 },
  "MG:varginha": { lat: -21.55, lng: -45.43 },
  "MG:lavras": { lat: -21.25, lng: -45.0 },
  "MG:caxambu": { lat: -21.98, lng: -44.93 },
  "MG:sao lourenco": { lat: -22.12, lng: -45.05 },
  "MG:passa quatro": { lat: -22.39, lng: -44.97 },

  // ─── Bahia ─────────────────────────────────────────────────────────────────
  "BA:feira de santana": { lat: -12.27, lng: -38.97 },
  "BA:lauro de freitas": { lat: -12.89, lng: -38.33 },
  "BA:camacari": { lat: -12.7, lng: -38.32 },
  "BA:mata de sao joao": { lat: -12.53, lng: -38.3 },
  "BA:porto seguro": { lat: -16.45, lng: -39.06 },
  "BA:ilheus": { lat: -14.79, lng: -39.05 },
  "BA:itacare": { lat: -14.28, lng: -38.99 },
  "BA:lencois": { lat: -12.56, lng: -41.39 },
  "BA:vitoria da conquista": { lat: -14.87, lng: -40.84 },
  "BA:itabuna": { lat: -14.79, lng: -39.28 },
  "BA:juazeiro": { lat: -9.41, lng: -40.5 },

  // ─── Pernambuco ────────────────────────────────────────────────────────────
  "PE:olinda": { lat: -8.01, lng: -34.86 },
  "PE:jaboatao dos guararapes": { lat: -8.11, lng: -35.01 },
  "PE:ipojuca": { lat: -8.4, lng: -35.06 },
  "PE:caruaru": { lat: -8.28, lng: -35.98 },
  "PE:gravata": { lat: -8.2, lng: -35.56 },
  "PE:fernando de noronha": { lat: -3.85, lng: -32.42 },
  "PE:petrolina": { lat: -9.39, lng: -40.5 },

  // ─── Ceará ─────────────────────────────────────────────────────────────────
  "CE:caucaia": { lat: -3.74, lng: -38.66 },
  "CE:aquiraz": { lat: -3.9, lng: -38.39 },
  "CE:jijoca de jericoacoara": { lat: -2.8, lng: -40.51 },
  "CE:juazeiro do norte": { lat: -7.21, lng: -39.32 },
  "CE:sobral": { lat: -3.69, lng: -40.35 },

  // ─── Rio Grande do Norte / Paraíba / Alagoas / Sergipe ─────────────────────
  "RN:parnamirim": { lat: -5.92, lng: -35.26 },
  "RN:tibau do sul": { lat: -6.19, lng: -35.08 },
  "RN:mossoro": { lat: -5.19, lng: -37.34 },
  "RN:goianinha": { lat: -6.27, lng: -35.21 },
  "RN:sao goncalo do amarante": { lat: -5.79, lng: -35.33 },
  "RN:macaiba": { lat: -5.86, lng: -35.35 },
  "RN:nisia floresta": { lat: -6.09, lng: -35.2 },
  "RN:extremoz": { lat: -5.71, lng: -35.31 },
  "RN:ceara mirim": { lat: -5.63, lng: -35.43 },
  "RN:maxaranguape": { lat: -5.51, lng: -35.26 },
  "RN:touros": { lat: -5.2, lng: -35.46 },
  "RN:sao miguel do gostoso": { lat: -5.12, lng: -35.63 },
  "RN:baia formosa": { lat: -6.37, lng: -35.01 },
  "RN:caico": { lat: -6.46, lng: -37.1 },
  "PB:campina grande": { lat: -7.23, lng: -35.88 },
  "PB:conde": { lat: -7.26, lng: -34.91 },
  "AL:maragogi": { lat: -9.01, lng: -35.22 },
  "AL:japaratinga": { lat: -9.09, lng: -35.26 },
  "AL:arapiraca": { lat: -9.75, lng: -36.66 },

  // ─── Norte ─────────────────────────────────────────────────────────────────
  "PA:ananindeua": { lat: -1.37, lng: -48.37 },
  "PA:santarem": { lat: -2.44, lng: -54.7 },
  "PA:maraba": { lat: -5.37, lng: -49.12 },
  "AM:parintins": { lat: -2.63, lng: -56.74 },
  "AP:santana": { lat: -0.06, lng: -51.18 },
  "AC:cruzeiro do sul": { lat: -7.63, lng: -72.67 },
  "RO:ji parana": { lat: -10.88, lng: -61.95 },
  "TO:araguaina": { lat: -7.19, lng: -48.21 },
  "MA:imperatriz": { lat: -5.53, lng: -47.48 },
  "MA:barreirinhas": { lat: -2.75, lng: -42.83 },
  "PI:parnaiba": { lat: -2.9, lng: -41.78 },

  // ─── Paraná ────────────────────────────────────────────────────────────────
  "PR:londrina": { lat: -23.31, lng: -51.16 },
  "PR:maringa": { lat: -23.42, lng: -51.94 },
  "PR:foz do iguacu": { lat: -25.54, lng: -54.59 },
  "PR:ponta grossa": { lat: -25.09, lng: -50.16 },
  "PR:cascavel": { lat: -24.96, lng: -53.46 },
  "PR:sao jose dos pinhais": { lat: -25.53, lng: -49.21 },
  "PR:morretes": { lat: -25.48, lng: -48.83 },
  "PR:guaratuba": { lat: -25.88, lng: -48.57 },
  "PR:matinhos": { lat: -25.82, lng: -48.54 },

  // ─── Santa Catarina ────────────────────────────────────────────────────────
  "SC:joinville": { lat: -26.3, lng: -48.85 },
  "SC:blumenau": { lat: -26.92, lng: -49.07 },
  "SC:balneario camboriu": { lat: -26.99, lng: -48.63 },
  "SC:itajai": { lat: -26.91, lng: -48.66 },
  "SC:chapeco": { lat: -27.1, lng: -52.62 },
  "SC:criciuma": { lat: -28.68, lng: -49.37 },
  "SC:lages": { lat: -27.82, lng: -50.33 },
  "SC:bombinhas": { lat: -27.14, lng: -48.48 },
  "SC:porto belo": { lat: -27.16, lng: -48.55 },
  "SC:penha": { lat: -26.77, lng: -48.65 },
  "SC:garopaba": { lat: -28.03, lng: -48.62 },
  "SC:sao joaquim": { lat: -28.29, lng: -49.93 },
  "SC:urubici": { lat: -28.02, lng: -49.59 },
  "SC:gaspar": { lat: -26.93, lng: -48.96 },

  // ─── Rio Grande do Sul ─────────────────────────────────────────────────────
  "RS:caxias do sul": { lat: -29.17, lng: -51.18 },
  "RS:canoas": { lat: -29.92, lng: -51.18 },
  "RS:gravatai": { lat: -29.94, lng: -51.0 },
  "RS:novo hamburgo": { lat: -29.69, lng: -51.13 },
  "RS:sao leopoldo": { lat: -29.76, lng: -51.15 },
  "RS:gramado": { lat: -29.38, lng: -50.87 },
  "RS:canela": { lat: -29.36, lng: -50.81 },
  "RS:bento goncalves": { lat: -29.17, lng: -51.52 },
  "RS:garibaldi": { lat: -29.26, lng: -51.53 },
  "RS:pelotas": { lat: -31.77, lng: -52.34 },
  "RS:santa maria": { lat: -29.68, lng: -53.81 },
  "RS:torres": { lat: -29.34, lng: -49.73 },
  "RS:capao da canoa": { lat: -29.75, lng: -50.01 },
  "RS:esteio": { lat: -29.86, lng: -51.18 },
  "RS:sapucaia do sul": { lat: -29.83, lng: -51.15 },
  "RS:cachoeirinha": { lat: -29.95, lng: -51.09 },
  "RS:alvorada": { lat: -30.0, lng: -51.08 },
  "RS:viamao": { lat: -30.08, lng: -51.02 },
  "RS:guaiba": { lat: -30.11, lng: -51.33 },
  "RS:nova petropolis": { lat: -29.38, lng: -51.11 },
  "RS:farroupilha": { lat: -29.22, lng: -51.34 },
  "RS:flores da cunha": { lat: -29.03, lng: -51.18 },
  "RS:carlos barbosa": { lat: -29.3, lng: -51.5 },
  "RS:cambara do sul": { lat: -29.05, lng: -50.14 },
  "RS:sao francisco de paula": { lat: -29.45, lng: -50.58 },
  "RS:tres coroas": { lat: -29.52, lng: -50.78 },
  "RS:taquara": { lat: -29.65, lng: -50.78 },
  "RS:tramandai": { lat: -29.98, lng: -50.13 },
  "RS:osorio": { lat: -29.89, lng: -50.27 },
  "RS:xangri la": { lat: -29.79, lng: -50.05 },
  "RS:rio grande": { lat: -32.03, lng: -52.1 },
  "RS:passo fundo": { lat: -28.26, lng: -52.41 },
  "RS:erechim": { lat: -27.63, lng: -52.27 },
  "RS:santa cruz do sul": { lat: -29.72, lng: -52.43 },
  "RS:lajeado": { lat: -29.47, lng: -51.96 },
  "RS:bage": { lat: -31.33, lng: -54.11 },
  "RS:uruguaiana": { lat: -29.75, lng: -57.09 },

  // ─── Centro-Oeste ──────────────────────────────────────────────────────────
  "GO:aparecida de goiania": { lat: -16.82, lng: -49.24 },
  "GO:anapolis": { lat: -16.33, lng: -48.95 },
  "GO:caldas novas": { lat: -17.74, lng: -48.62 },
  "GO:pirenopolis": { lat: -15.85, lng: -48.96 },
  "GO:rio verde": { lat: -17.79, lng: -50.92 },
  "GO:alto paraiso de goias": { lat: -14.13, lng: -47.51 },
  "GO:formosa": { lat: -15.54, lng: -47.33 },
  "GO:trindade": { lat: -16.65, lng: -49.49 },
  "GO:senador canedo": { lat: -16.71, lng: -49.09 },
  "GO:luziania": { lat: -16.25, lng: -47.95 },
  "GO:valparaiso de goias": { lat: -16.06, lng: -47.98 },
  "GO:aguas lindas de goias": { lat: -15.75, lng: -48.28 },
  "GO:planaltina": { lat: -15.45, lng: -47.61 },
  "GO:catalao": { lat: -18.17, lng: -47.94 },
  "GO:itumbiara": { lat: -18.42, lng: -49.22 },
  "GO:jatai": { lat: -17.88, lng: -51.72 },
  "GO:goianesia": { lat: -15.32, lng: -49.12 },
  "GO:cavalcante": { lat: -13.8, lng: -47.46 },
  // DF: regiões administrativas que as pessoas escrevem como "cidade"
  "DF:taguatinga": { lat: -15.83, lng: -48.06 },
  "DF:ceilandia": { lat: -15.82, lng: -48.11 },
  "DF:aguas claras": { lat: -15.84, lng: -48.03 },
  "DF:guara": { lat: -15.83, lng: -47.98 },
  "DF:samambaia": { lat: -15.88, lng: -48.09 },
  "DF:gama": { lat: -16.02, lng: -48.06 },
  "DF:sobradinho": { lat: -15.65, lng: -47.79 },
  "DF:planaltina": { lat: -15.62, lng: -47.65 },
  "DF:lago sul": { lat: -15.85, lng: -47.87 },
  "DF:lago norte": { lat: -15.73, lng: -47.85 },
  "DF:asa sul": { lat: -15.82, lng: -47.9 },
  "DF:asa norte": { lat: -15.76, lng: -47.88 },
  "MT:varzea grande": { lat: -15.65, lng: -56.13 },
  "MT:rondonopolis": { lat: -16.47, lng: -54.64 },
  "MT:chapada dos guimaraes": { lat: -15.46, lng: -55.75 },
  "MT:pocone": { lat: -16.26, lng: -56.62 },
  "MT:nobres": { lat: -14.72, lng: -56.33 },
  "MS:bonito": { lat: -21.13, lng: -56.49 },
  "MS:dourados": { lat: -22.22, lng: -54.81 },
  "MS:corumba": { lat: -19.01, lng: -57.65 },
  "MS:tres lagoas": { lat: -20.75, lng: -51.68 },

  // ─── Espírito Santo ────────────────────────────────────────────────────────
  "ES:vila velha": { lat: -20.33, lng: -40.29 },
  "ES:serra": { lat: -20.13, lng: -40.31 },
  "ES:cariacica": { lat: -20.26, lng: -40.42 },
  "ES:guarapari": { lat: -20.67, lng: -40.5 },
  "ES:domingos martins": { lat: -20.36, lng: -40.66 },
  "ES:linhares": { lat: -19.39, lng: -40.07 },
};

/** Minúsculas, sem acento, sem hífen e sem espaços duplicados. */
export function normalizarCidade(cidade: string): string {
  return cidade
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[-']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Índice cidade-normalizada → UFs em que ela existe na tabela (para inferir a UF). */
let indicePorCidade: Map<string, string[]> | null = null;
function ufsDaCidade(cidadeNormalizada: string): string[] {
  if (!indicePorCidade) {
    indicePorCidade = new Map();
    for (const chave of Object.keys(MUNICIPIOS)) {
      const [uf, cidade] = chave.split(":");
      const lista = indicePorCidade.get(cidade) ?? [];
      lista.push(uf);
      indicePorCidade.set(cidade, lista);
    }
  }
  return indicePorCidade.get(cidadeNormalizada) ?? [];
}

/**
 * Coordenadas reais da cidade, ou null se ela não está mapeada.
 *
 * Não cai no centroide da UF de propósito: um centroide vira uma distância
 * falsa e precisa (Jarinu "a 260 km" de São Paulo, quando fica a 60). Sem
 * coordenadas, o motor usa "mesma UF" e não elimina ninguém por distância.
 *
 * Sem UF, resolve mesmo assim quando o nome existe em uma única UF da tabela
 * ("Caxias do Sul" → RS); nome ambíguo continua null.
 */
export function geocodificarCidade(
  cidade: string | null | undefined,
  estado: string | null | undefined
): Coordenadas | null {
  if (!cidade) return null;
  const nome = normalizarCidade(cidade);
  if (!nome) return null;

  const uf = (estado ?? "").trim().toUpperCase();
  if (uf) return MUNICIPIOS[`${uf}:${nome}`] ?? null;

  const ufs = ufsDaCidade(nome);
  return ufs.length === 1 ? MUNICIPIOS[`${ufs[0]}:${nome}`] : null;
}

/** Centro aproximado da UF — só para centralizar mapas, nunca para pontuar. */
export function centroideUF(estado: string | null | undefined): Coordenadas | null {
  return CENTROIDES_UF[(estado ?? "").trim().toUpperCase()] ?? null;
}
