import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CACHE_MEDIUM, queryKeys } from "@/lib/query-cache-policy";
import { ChevronLeft, Search, Users } from "lucide-react";
import { LIST_CARD, LIST_CARD_CONTENT_FLUSH, LIST_CARD_HEADER, LIST_TABLE_FOOTER } from "@/lib/list-card-layout";
import { cn } from "@/lib/utils";
import { TABLE_CELL_MAIN_MOBILE, TABLE_COL_MD_ONLY } from "@/lib/table-responsive";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listarFuncionariosEmpresaAdmin } from "@/lib/api-admin";

export default function AdminEmpresaFuncionariosPage() {
  const navigate = useNavigate();
  const { empresaId = "" } = useParams<{ empresaId: string }>();
  const location = useLocation();
  const empresaUsername =
    (location.state as { username?: string } | null)?.username?.trim() || "empresa";

  const [page, setPage] = useState(0);
  const [nomeFiltro, setNomeFiltro] = useState("");
  const [nomeBusca, setNomeBusca] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.admin.empresaFuncionarios(empresaId, page, nomeBusca),
    queryFn: () =>
      listarFuncionariosEmpresaAdmin(empresaId, {
        page,
        size: 30,
        nome: nomeBusca || undefined,
      }),
    enabled: !!empresaId,
    ...CACHE_MEDIUM,
  });

  const lista = data?.conteudo ?? [];
  const pag = data?.paginacao;
  const totalPaginas = pag?.totalPaginas ?? 1;

  const buscar = () => {
    setNomeBusca(nomeFiltro.trim());
    setPage(0);
  };

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2"
        onClick={() => navigate("/admin/empresas")}
      >
        <ChevronLeft className="mr-1 h-4 w-4" /> Empresas
      </Button>

      <div className="flex flex-wrap items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <div>
          <h1 className="font-display text-xl font-semibold">Funcionários</h1>
          <p className="text-sm text-muted-foreground">
            Funcionários da empresa <span className="font-medium text-foreground">{empresaUsername}</span>.
          </p>
        </div>
      </div>

      <Card className={LIST_CARD}>
        <CardHeader className={LIST_CARD_HEADER}>
          <CardTitle className="text-base">Funcionários</CardTitle>
        </CardHeader>
        <CardContent className={`${LIST_CARD_CONTENT_FLUSH} space-y-3 px-4 pb-4 sm:px-5`}>
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[12rem] flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Buscar por nome…"
                value={nomeFiltro}
                onChange={(ev) => setNomeFiltro(ev.target.value)}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter") buscar();
                }}
              />
            </div>
            <Button type="button" variant="secondary" onClick={buscar}>
              Buscar
            </Button>
          </div>

          {isError && (
            <p className="text-sm text-destructive">Não foi possível carregar os funcionários.</p>
          )}
          {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {!isLoading && lista.length === 0 && !isError && (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhum funcionário.</p>
          )}
          {!isLoading && lista.length > 0 && (
            <>
              <div className="-mx-4 overflow-x-auto sm:-mx-5">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead className={TABLE_COL_MD_ONLY}>Username</TableHead>
                      <TableHead className={TABLE_COL_MD_ONLY}>E-mail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lista.map((f) => (
                      <TableRow key={f.usuarioId}>
                        <TableCell className={cn("font-medium", TABLE_CELL_MAIN_MOBILE)}>
                          {[f.primeiroNome, f.ultimoNome].filter(Boolean).join(" ") || "—"}
                        </TableCell>
                        <TableCell className={TABLE_COL_MD_ONLY}>{f.username}</TableCell>
                        <TableCell className={cn("text-muted-foreground", TABLE_COL_MD_ONLY)}>
                          {f.emails?.[0] ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPaginas > 1 && (
                <div className={LIST_TABLE_FOOTER}>
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    Página {page + 1} de {totalPaginas}
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Anterior
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page >= totalPaginas - 1}
                      onClick={() => setPage((p) => p + 1)}
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
