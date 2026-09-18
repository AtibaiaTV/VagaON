/**
 * Opções dos filtros do banco de profissionais. Módulo puro, sem "use client":
 * a página (Server Component) e o componente de filtros (Client) leem daqui.
 *
 * Exportar isto de dentro de um componente cliente quebrava o servidor: um
 * Server Component que importa um valor de um módulo "use client" recebe uma
 * referência de cliente, e `RAIOS_KM.includes(...)` lançava exceção. Como a
 * linha só rodava quando havia cidade de referência, o erro aparecia apenas
 * ao filtrar por cidade.
 */

export const TIPOS_CONTRATO = [
  { value: "clt", label: "CLT" },
  { value: "temporario", label: "Temporário" },
  { value: "sazonal", label: "Sazonal" },
];

export const RAIOS_KM = [10, 25, 50, 100, 200];

export const ORDENS = [
  { value: "relevancia", label: "Perfil mais completo" },
  { value: "distancia", label: "Mais perto" },
  { value: "recentes", label: "Cadastro mais recente" },
  { value: "atualizados", label: "Atualizado há menos tempo" },
  { value: "ativos", label: "Ativo há menos tempo" },
];
