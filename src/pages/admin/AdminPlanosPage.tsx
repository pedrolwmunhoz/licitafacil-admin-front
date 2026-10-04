import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CACHE_MEDIUM, queryKeys } from "@/lib/query-cache-policy";
import { CreditCard, Pencil } from "lucide-react";
import { LIST_CARD, LIST_CARD_CONTENT_FLUSH, LIST_CARD_HEADER, LIST_TABLE_FOOTER } from "@/lib/list-card-layout";
import { cn, formatDataHora } from "@/lib/utils";
import { TABLE_CELL_MAIN_MOBILE, TABLE_COL_MD_ONLY } from "@/lib/table-responsive";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listarEmpresasPlanosAdmin } from "@/lib/api-admin";
import { getNomeTipoAssinatura } from "@/constants/tipoAssinatura";
import type { AdminEmpresaPlanoResponse } from "@/types/admin";

function fmtPeriodo(iso: string | null | undefined): string {
  if (!iso) return "—";
  return formatDataHora(iso, "UTC");
}

export default function AdminPlanosPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const size = 10;

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.admin.planos(page, size),
    queryFn: () => listarEmpresasPlanosAdmin({ page, size }),
    ...CACHE_MEDIUM,
  });

  const itens = data?.conteudo ?? [];
  const paginacao = data?.paginacao;
  const totalPaginas = paginacao?.totalPaginas ?? 1;

  const openEditar = (e: AdminEmpresaPlanoResponse) => {
    navigate(`/admin/planos/${e.empresaId}/editar`, { state: { empresa: e } });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <CreditCard className="h-5 w-5 text-primary" />
        <div>
          <h1 className="font-display text-xl font-semibold">Planos</h1>
          <p className="text-sm text-muted-foreground">
            Empresas e plano vigente. Editar grava plano e período (acesso liberado até a data fim).
          </p>
        </div>
      </div>

      <Card className={LIST_CARD}>
        <CardHeader className={LIST_CARD_HEADER}>
          <CardTitle className="text-base">Empresas e planos</CardTitle>
        </CardHeader>
        <CardContent className={`${LIST_CARD_CONTENT_FLUSH} space-y-3 px-4 pb-4 sm:px-5`}>
          {isError && (
            <p className="text-sm text-destructive">Não foi possível carregar os planos.</p>
          )}
          {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {!isLoading && itens.length === 0 && !isError && (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma empresa.</p>
          )}
          {!isLoading && itens.length > 0 && (
            <>
              <div className="-mx-4 overflow-x-auto sm:-mx-5">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead className={TABLE_COL_MD_ONLY}>Início</TableHead>
                      <TableHead className={TABLE_COL_MD_ONLY}>Fim</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.map((e) => (
                      <TableRow key={e.empresaId}>
                        <TableCell className={cn("font-medium", TABLE_CELL_MAIN_MOBILE)}>
                          {e.username}
                        </TableCell>
                        <TableCell>
                          {getNomeTipoAssinatura(e.tipoAssinaturaId) ?? "—"}
                        </TableCell>
                        <TableCell className={TABLE_COL_MD_ONLY}>{fmtPeriodo(e.periodoInicio)}</TableCell>
                        <TableCell className={TABLE_COL_MD_ONLY}>{fmtPeriodo(e.periodoFim)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => openEditar(e)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Editar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page + 1 >= totalPaginas}
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
