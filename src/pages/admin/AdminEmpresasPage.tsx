import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CACHE_MEDIUM, queryKeys } from "@/lib/query-cache-policy";
import { Building2, Pencil, Users } from "lucide-react";
import { LIST_CARD, LIST_CARD_CONTENT_FLUSH, LIST_CARD_HEADER, LIST_TABLE_FOOTER } from "@/lib/list-card-layout";
import { cn, formatDataHora } from "@/lib/utils";
import { TABLE_CELL_MAIN_MOBILE, TABLE_COL_MD_ONLY } from "@/lib/table-responsive";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listarEmpresasAdmin } from "@/lib/api-admin";
import { getNomeTipoAssinatura } from "@/constants/tipoAssinatura";
import type { AdminEmpresaListagemResponse } from "@/types/admin";

export default function AdminEmpresasPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const size = 10;

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.admin.empresas(page, size),
    queryFn: () => listarEmpresasAdmin({ page, size }),
    ...CACHE_MEDIUM,
  });

  const empresas = data?.conteudo ?? [];
  const paginacao = data?.paginacao;
  const totalPaginas = paginacao?.totalPaginas ?? 1;

  const openFuncionarios = (e: AdminEmpresaListagemResponse) => {
    navigate(`/admin/empresas/${e.usuarioId}/funcionarios`, {
      state: { username: e.username },
    });
  };

  const openEditar = (e: AdminEmpresaListagemResponse) => {
    navigate(`/admin/empresas/${e.usuarioId}/editar`, {
      state: { username: e.username },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Building2 className="h-5 w-5 text-primary" />
        <div>
          <h1 className="font-display text-xl font-semibold">Empresas</h1>
          <p className="text-sm text-muted-foreground">
            Listagem de empresas cadastradas. Cobrança é assinatura recorrente automática na AbacatePay.
          </p>
        </div>
      </div>

      <Card className={LIST_CARD}>
        <CardHeader className={LIST_CARD_HEADER}>
          <CardTitle className="text-base">Empresas</CardTitle>
        </CardHeader>
        <CardContent className={`${LIST_CARD_CONTENT_FLUSH} space-y-3 px-4 pb-4 sm:px-5`}>
          {isError && (
            <p className="text-sm text-destructive">Não foi possível carregar as empresas.</p>
          )}
          {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {!isLoading && empresas.length === 0 && !isError && (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma empresa.</p>
          )}
          {!isLoading && empresas.length > 0 && (
            <>
              <div className="-mx-4 overflow-x-auto sm:-mx-5">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Data</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead className={TABLE_COL_MD_ONLY}>E-mails</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[220px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {empresas.map((e) => {
                      const plano =
                        getNomeTipoAssinatura(e.tipoAssinaturaId) ?? e.tipoAssinaturaNome ?? null;
                      return (
                        <TableRow key={e.usuarioId}>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {e.createdAt ? formatDataHora(e.createdAt) : "—"}
                          </TableCell>
                          <TableCell className={cn("font-medium", TABLE_CELL_MAIN_MOBILE)}>
                            {e.username}
                          </TableCell>
                          <TableCell
                            className={cn("max-w-[240px] truncate text-muted-foreground", TABLE_COL_MD_ONLY)}
                          >
                            {e.emails?.length ? e.emails.join(", ") : "—"}
                          </TableCell>
                          <TableCell>
                            {plano ? (
                              <Badge
                                variant="secondary"
                                className="max-w-[10rem] truncate font-normal"
                                title={plano}
                              >
                                {plano}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                "border-0 font-normal",
                                e.pago
                                  ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
                                  : "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
                              )}
                            >
                              {e.pago ? "Pago" : "Não pago"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1"
                                onClick={() => openEditar(e)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1"
                                onClick={() => openFuncionarios(e)}
                              >
                                <Users className="h-3.5 w-3.5" />
                                Listar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {totalPaginas > 1 && (
                <div className={LIST_TABLE_FOOTER}>
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    Página {(paginacao?.paginaAtual ?? page) + 1} de {totalPaginas}
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPaginas - 1, p + 1))}
                      disabled={page >= totalPaginas - 1}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
