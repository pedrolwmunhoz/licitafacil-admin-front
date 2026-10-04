import type { Paginacao, CriarFeriadoRequest, EditarFeriadoRequest, FeriadoListagemPageResponse } from "./empresa";

// Usuários (listagem admin)

export interface AdminUsuarioListagemResponse {
  usuarioId: string;
  username: string;
  tipo: string;
  emails: string[];
  telefones: {
    codigoPais: string;
    ddd: string;
    numero: string;
  }[];
}

export interface AdminUsuarioListagemPageResponse {
  paginacao: Paginacao;
  conteudo: AdminUsuarioListagemResponse[];
}

/** GET /api/admin/empresas */
export interface AdminEmpresaListagemResponse {
  usuarioId: string;
  username: string;
  tipo: string;
  createdAt: string | null;
  emails: string[];
  telefones: {
    codigoPais: string;
    ddd: string;
    numero: string;
  }[];
  tipoAssinaturaId: number | null;
  tipoAssinaturaNome: string | null;
  pago: boolean;
}

export interface AdminEmpresaListagemPageResponse {
  paginacao: Paginacao;
  conteudo: AdminEmpresaListagemResponse[];
}

export interface AdminListarUsuariosParams {
  page?: number;
  size?: number;
}

export interface AdminCriarRequest {
  username: string;
  senha: string;
  tipoCredencial: "EMAIL" | "USERNAME";
  valorCredencial: string;
}

// Feriados admin: reutilizamos FeriadoListagemPageResponse, CriarFeriadoRequest, EditarFeriadoRequest

export type AdminFeriadoListagemPageResponse = FeriadoListagemPageResponse;
export type AdminCriarFeriadoRequest = CriarFeriadoRequest;
export type AdminEditarFeriadoRequest = EditarFeriadoRequest;

// Métricas (admin)

export interface AdminEmpresasCadastroMetricasResponse {
  inicio: string; // YYYY-MM-DD
  fim: string; // YYYY-MM-DD
  pontos: { data: string; total: number }[]; // data YYYY-MM-DD
}

export interface AdminEmpresasCadastroPeriodoOpcoesResponse {
  anos: number[];
  mesesAnoAtual: number[]; // 1..12
}

// Planos (admin)

export interface AdminEmpresaPlanoResponse {
  empresaId: string;
  username: string;
  tipoAssinaturaId: number | null;
  tipoAssinaturaNome: string | null;
  periodoInicio: string | null; // ISO Instant
  periodoFim: string | null;
  cobrancaAtiva: boolean | null;
  assinaturaAtiva: boolean | null;
}

export interface AdminEmpresaPlanoPageResponse {
  paginacao: Paginacao;
  conteudo: AdminEmpresaPlanoResponse[];
}

export interface AdminEditarPlanoEmpresaRequest {
  tipoAssinaturaId: number;
  periodoInicio: string; // YYYY-MM-DD
  periodoFim: string; // YYYY-MM-DD
}

/** PUT /api/admin/empresas/{empresaId} */
export interface AdminAtualizarEmpresaRequest {
  username?: string | null;
  razaoSocial?: string | null;
  email?: string | null;
  telefone?: { codigoPais: string; ddd: string; numero: string } | null;
  endereco?: {
    rua: string;
    numero: string;
    complemento?: string | null;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  } | null;
  jornada?: {
    tipoEscalaJornadaId: number;
    cargaHorariaDiaria: string;
    cargaHorariaSemanal: string;
    toleranciaPadrao: string;
    intervaloPadrao?: string | null;
    tempoDescansoEntreJornada?: string;
    entradaPadrao: string;
    saidaPadrao: string;
    timezone: string;
    gravaGeoObrigatoria: boolean;
    gravaPontoApenasEmGeofence: boolean;
    permiteAjustePonto: boolean;
  } | null;
}

/** GET /api/admin/blog/comentarios */
export interface AdminBlogComentarioResponse {
  id: string;
  postSlug: string;
  nome: string;
  email: string | null;
  texto: string;
  aprovado: boolean;
  dataAprovacao: string | null;
  createdAt: string;
}

export interface AdminBlogComentarioPageResponse {
  paginacao: Paginacao;
  conteudo: AdminBlogComentarioResponse[];
}

/** GET /api/admin/blog/metricas* */
export type AdminBlogMetricaPeriodo =
  | "ULTIMOS_7"
  | "ULTIMOS_28"
  | "ULTIMOS_90"
  | "ULTIMOS_365"
  | "VIDA_TODA"
  | "ANO"
  | "MES"
  | "CUSTOM";

export type AdminBlogMetricaOverviewTipo = "VIEWS" | "TEMPO" | "VISITANTES";

export type AdminBlogMetricaConteudoTipo =
  | "VIEWS"
  | "DURACAO_MEDIA"
  | "SCROLL"
  | "CURTIDAS"
  | "COMENTARIOS";

export interface AdminBlogMetricaKpi {
  valor: number;
  variacaoPercentual: number | null;
}

export interface AdminBlogMetricaPontoDia {
  data: string;
  valor: number;
}

export interface AdminBlogMetricasOverviewResponse {
  inicio: string;
  fim: string;
  periodoLabel: string;
  headline: string;
  metrica: AdminBlogMetricaOverviewTipo;
  views: AdminBlogMetricaKpi;
  tempoLeituraHoras: AdminBlogMetricaKpi;
  visitantesUnicos: AdminBlogMetricaKpi;
  serie: AdminBlogMetricaPontoDia[];
}

export interface AdminBlogMetricasConteudoResponse {
  inicio: string;
  fim: string;
  periodoLabel: string;
  metrica: AdminBlogMetricaConteudoTipo;
  views: AdminBlogMetricaKpi;
  duracaoMediaSegundos: AdminBlogMetricaKpi;
  scrollMedioPercentual: AdminBlogMetricaKpi;
  curtidas: AdminBlogMetricaKpi;
  comentarios: AdminBlogMetricaKpi;
  serie: AdminBlogMetricaPontoDia[];
}

export interface AdminBlogMetricasTopConteudoResponse {
  inicio: string;
  fim: string;
  periodoLabel: string;
  itens: Array<{
    slug: string;
    views: number;
    tempoMedioSegundos: number | null;
    percentualMedioLido: number | null;
  }>;
}

export interface AdminBlogMetricasOrigensResponse {
  inicio: string;
  fim: string;
  periodoLabel: string;
  itens: Array<{
    referrer: string;
    visitas: number;
  }>;
}

export type AdminBlogMetricasPeriodoParams = {
  periodo?: AdminBlogMetricaPeriodo;
  ano?: number;
  mes?: number;
  de?: string;
  ate?: string;
};

export type AdminBlogMetricasOverviewParams = AdminBlogMetricasPeriodoParams & {
  metrica?: AdminBlogMetricaOverviewTipo;
};

export type AdminBlogMetricasConteudoParams = AdminBlogMetricasPeriodoParams & {
  metrica?: AdminBlogMetricaConteudoTipo;
};


