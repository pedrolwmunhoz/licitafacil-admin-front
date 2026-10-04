import api from "./api";
import type {
  AdminUsuarioListagemPageResponse,
  AdminEmpresaListagemPageResponse,
  AdminListarUsuariosParams,
  AdminCriarRequest,
  AdminFeriadoListagemPageResponse,
  AdminCriarFeriadoRequest,
  AdminEditarFeriadoRequest,
  AdminEmpresasCadastroMetricasResponse,
  AdminEmpresasCadastroPeriodoOpcoesResponse,
  AdminEmpresaPlanoPageResponse,
  AdminEditarPlanoEmpresaRequest,
  AdminAtualizarEmpresaRequest,
  AdminBlogComentarioPageResponse,
  AdminBlogMetricasConteudoParams,
  AdminBlogMetricasConteudoResponse,
  AdminBlogMetricasOrigensResponse,
  AdminBlogMetricasOverviewParams,
  AdminBlogMetricasOverviewResponse,
  AdminBlogMetricasPeriodoParams,
  AdminBlogMetricasTopConteudoResponse,
} from "@/types/admin";
import type { EmpresaPerfilResponse, FuncionarioListagemPageResponse } from "@/types/empresa";

const BASE = "/api/admin";
const METRICAS_BASE = `${BASE}/metricas`;
const BLOG_COMENTARIOS_BASE = `${BASE}/blog/comentarios`;
const BLOG_METRICAS_BASE = `${BASE}/blog/metricas`;

// Usuários

export function listarUsuariosAdmin(
  params: AdminListarUsuariosParams = {},
): Promise<AdminUsuarioListagemPageResponse> {
  const { page = 0, size = 10 } = params;
  return api
    .get<AdminUsuarioListagemPageResponse>(`${BASE}/usuarios`, {
      params: { page, size },
    })
    .then((r) => r.data);
}

export function criarAdmin(body: AdminCriarRequest): Promise<string> {
  return api.post<string>(`${BASE}/usuarios`, body).then((r) => r.data);
}

export function desbloquearUsuario(usuarioId: string): Promise<void> {
  return api.post(`${BASE}/usuario/${usuarioId}/desbloquear`).then(() => undefined);
}

/** POST /api/admin/usuario/{usuarioId}/resetar-senha */
export function resetarSenhaUsuarioAdmin(
  usuarioId: string,
  body: { senhaNova: string },
): Promise<void> {
  return api.post(`${BASE}/usuario/${usuarioId}/resetar-senha`, body).then(() => undefined);
}

/** DELETE físico em users (CASCADE no banco). Não disponível para tipo ADMIN — backend recusa. */
export function deletarUsuarioAdmin(usuarioId: string): Promise<void> {
  return api.delete(`${BASE}/usuario/${usuarioId}`).then(() => undefined);
}

export function listarEmpresasAdmin(
  params: AdminListarUsuariosParams = {},
): Promise<AdminEmpresaListagemPageResponse> {
  const { page = 0, size = 10 } = params;
  return api
    .get<AdminEmpresaListagemPageResponse>(`${BASE}/empresas`, { params: { page, size } })
    .then((r) => r.data);
}

/** GET /api/admin/empresas/{empresaId}/perfil */
export function getPerfilEmpresaAdmin(empresaId: string): Promise<EmpresaPerfilResponse> {
  return api
    .get<EmpresaPerfilResponse>(`${BASE}/empresas/${empresaId}/perfil`)
    .then((r) => r.data);
}

/** PUT /api/admin/empresas/{empresaId} */
export function atualizarEmpresaAdmin(
  empresaId: string,
  body: AdminAtualizarEmpresaRequest,
): Promise<void> {
  return api.put(`${BASE}/empresas/${empresaId}`, body).then(() => undefined);
}

/** DELETE /api/admin/empresas/{empresaId}/jornada-config — reseta onboarding (config inicial). */
export function excluirJornadaConfigEmpresaAdmin(empresaId: string): Promise<void> {
  return api.delete(`${BASE}/empresas/${empresaId}/jornada-config`).then(() => undefined);
}

export interface MagicLinkGerarResponse {
  url: string;
  expiraEm: string;
}

/** POST /api/admin/empresas/{empresaId}/magic-link — convite CRM (48h). */
export function gerarMagicLinkEmpresaAdmin(empresaId: string): Promise<MagicLinkGerarResponse> {
  return api
    .post<MagicLinkGerarResponse>(`${BASE}/empresas/${empresaId}/magic-link`)
    .then((r) => r.data);
}

export function listarFuncionariosEmpresaAdmin(
  empresaId: string,
  params: { page?: number; size?: number; nome?: string } = {},
): Promise<FuncionarioListagemPageResponse> {
  const { page = 0, size = 50, nome } = params;
  return api
    .get<FuncionarioListagemPageResponse>(`${BASE}/empresas/${empresaId}/funcionarios`, {
      params: { page, size, ...(nome ? { nome } : {}) },
    })
    .then((r) => r.data);
}

// Feriados globais

export function listarFeriadosAdmin(
  params: { page?: number; size?: number } = {},
): Promise<AdminFeriadoListagemPageResponse> {
  const { page = 0, size = 20 } = params;
  return api
    .get<AdminFeriadoListagemPageResponse>(`${BASE}/feriados`, {
      params: { page, size },
    })
    .then((r) => r.data);
}

export function criarFeriadoAdmin(body: AdminCriarFeriadoRequest): Promise<void> {
  return api.post(`${BASE}/feriados`, body).then(() => undefined);
}

export function editarFeriadoAdmin(feriadoId: string, body: AdminEditarFeriadoRequest): Promise<void> {
  return api.put(`${BASE}/feriados/${feriadoId}`, body).then(() => undefined);
}

export function deletarFeriadoAdmin(feriadoId: string): Promise<void> {
  return api.delete(`${BASE}/feriados/${feriadoId}`).then(() => undefined);
}

// Feriados por empresa

export function listarFeriadosPorEmpresa(
  empresaId: string,
  params: { page?: number; size?: number } = {},
): Promise<AdminFeriadoListagemPageResponse> {
  const { page = 0, size = 20 } = params;
  return api
    .get<AdminFeriadoListagemPageResponse>(`${BASE}/empresas/${empresaId}/feriados`, {
      params: { page, size },
    })
    .then((r) => r.data);
}

export function criarFeriadoPorEmpresa(
  empresaId: string,
  body: AdminCriarFeriadoRequest,
): Promise<void> {
  return api.post(`${BASE}/empresas/${empresaId}/feriados`, body).then(() => undefined);
}

export function editarFeriadoPorEmpresa(
  empresaId: string,
  feriadoId: string,
  body: AdminEditarFeriadoRequest,
): Promise<void> {
  return api
    .put(`${BASE}/empresas/${empresaId}/feriados/${feriadoId}`, body)
    .then(() => undefined);
}

export function deletarFeriadoPorEmpresa(
  empresaId: string,
  feriadoId: string,
): Promise<void> {
  return api
    .delete(`${BASE}/empresas/${empresaId}/feriados/${feriadoId}`)
    .then(() => undefined);
}

/** Desativa assinatura/cobrança da empresa (admin). */
export function desativarCobrancaEmpresaAdmin(empresaId: string): Promise<void> {
  return api.post(`${BASE}/cobranca-uso/empresa/${empresaId}/desativar`).then(() => undefined);
}

/** GET /api/admin/planos/empresas — empresas com plano e vigência. */
export function listarEmpresasPlanosAdmin(
  params: AdminListarUsuariosParams = {},
): Promise<AdminEmpresaPlanoPageResponse> {
  const { page = 0, size = 10 } = params;
  return api
    .get<AdminEmpresaPlanoPageResponse>(`${BASE}/planos/empresas`, { params: { page, size } })
    .then((r) => r.data);
}

/** PUT /api/admin/planos/empresas/{empresaId} — define plano + período (fatura PAGO). */
export function editarPlanoEmpresaAdmin(
  empresaId: string,
  body: AdminEditarPlanoEmpresaRequest,
): Promise<void> {
  return api.put(`${BASE}/planos/empresas/${empresaId}`, body).then(() => undefined);
}

// Métricas

export function obterEmpresasCadastroMetricasAdmin(): Promise<AdminEmpresasCadastroMetricasResponse> {
  return api
    .get<AdminEmpresasCadastroMetricasResponse>(`${METRICAS_BASE}/empresas-cadastro`)
    .then((r) => r.data);
}

export type AdminEmpresasCadastroPreset =
  | "ULTIMOS_7_DIAS"
  | "ULTIMOS_28_DIAS"
  | "ULTIMOS_90_DIAS"
  | "ULTIMOS_365_DIAS"
  | "TODO_PERIODO";

export function obterEmpresasCadastroMetricasPorPeriodoAdmin(params: {
  preset?: AdminEmpresasCadastroPreset;
  ano?: number;
  mes?: number;
  inicio?: string; // YYYY-MM-DD
  fim?: string; // YYYY-MM-DD
}): Promise<AdminEmpresasCadastroMetricasResponse> {
  return api
    .get<AdminEmpresasCadastroMetricasResponse>(`${METRICAS_BASE}/empresas-cadastro`, { params })
    .then((r) => r.data);
}

export function obterEmpresasCadastroPeriodoOpcoesAdmin(): Promise<AdminEmpresasCadastroPeriodoOpcoesResponse> {
  return api
    .get<AdminEmpresasCadastroPeriodoOpcoesResponse>(`${METRICAS_BASE}/empresas-cadastro/opcoes-periodo`)
    .then((r) => r.data);
}

// Comentários do blog

/** GET /api/admin/blog/comentarios — aprovado=false são os pendentes de moderação. */
export function listarComentariosBlogAdmin(params: {
  aprovado: boolean;
  page: number;
  size: number;
}): Promise<AdminBlogComentarioPageResponse> {
  return api
    .get<AdminBlogComentarioPageResponse>(BLOG_COMENTARIOS_BASE, { params })
    .then((r) => r.data);
}

export function aprovarComentarioBlogAdmin(comentarioId: string): Promise<void> {
  return api.post(`${BLOG_COMENTARIOS_BASE}/${comentarioId}/aprovar`).then(() => undefined);
}

/** Recusa um pendente ou tira do ar um aprovado. */
export function excluirComentarioBlogAdmin(comentarioId: string): Promise<void> {
  return api.delete(`${BLOG_COMENTARIOS_BASE}/${comentarioId}`).then(() => undefined);
}

/** GET /api/admin/blog/metricas */
export function obterBlogMetricasOverviewAdmin(
  params: AdminBlogMetricasOverviewParams = {},
): Promise<AdminBlogMetricasOverviewResponse> {
  return api.get<AdminBlogMetricasOverviewResponse>(BLOG_METRICAS_BASE, { params }).then((r) => r.data);
}

/** GET /api/admin/blog/metricas/conteudo */
export function obterBlogMetricasConteudoAdmin(
  params: AdminBlogMetricasConteudoParams = {},
): Promise<AdminBlogMetricasConteudoResponse> {
  return api
    .get<AdminBlogMetricasConteudoResponse>(`${BLOG_METRICAS_BASE}/conteudo`, { params })
    .then((r) => r.data);
}

/** GET /api/admin/blog/metricas/top-conteudo */
export function obterBlogMetricasTopConteudoAdmin(
  params: AdminBlogMetricasPeriodoParams = {},
): Promise<AdminBlogMetricasTopConteudoResponse> {
  return api
    .get<AdminBlogMetricasTopConteudoResponse>(`${BLOG_METRICAS_BASE}/top-conteudo`, { params })
    .then((r) => r.data);
}

/** GET /api/admin/blog/metricas/origens */
export function obterBlogMetricasOrigensAdmin(
  params: AdminBlogMetricasPeriodoParams = {},
): Promise<AdminBlogMetricasOrigensResponse> {
  return api
    .get<AdminBlogMetricasOrigensResponse>(`${BLOG_METRICAS_BASE}/origens`, { params })
    .then((r) => r.data);
}
