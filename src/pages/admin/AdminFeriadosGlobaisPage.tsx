import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Trash2 } from "lucide-react";
import { LIST_CARD, LIST_CARD_CONTENT_FLUSH, LIST_CARD_HEADER, LIST_TABLE_FOOTER } from "@/lib/list-card-layout";
import { TABLE_CELL_MAIN_MOBILE, TABLE_COL_MD_ONLY } from "@/lib/table-responsive";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { CACHE_MEDIUM, queryKeys, invalidateUserMutation } from "@/lib/query-cache-policy";
import {
  listarFeriadosAdmin,
  criarFeriadoAdmin,
  deletarFeriadoAdmin,
} from "@/lib/api-admin";
import type { AdminFeriadoListagemPageResponse } from "@/types/admin";
import type { CriarFeriadoRequest } from "@/types/empresa";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminFeriadosGlobaisPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const size = 20;

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.feriados(page, size),
    queryFn: () => listarFeriadosAdmin({ page, size }),
    ...CACHE_MEDIUM,
  });

  const [novo, setNovo] = useState<CriarFeriadoRequest>({
    data: "",
    descricao: "",
    tipoFeriadoId: 1,
    ativo: true,
  });

  const createMutation = useMutation({
    mutationFn: (body: CriarFeriadoRequest) => criarFeriadoAdmin(body),
    onSuccess: () => {
      toast({ title: "Feriado criado" });
      setNovo({ data: "", descricao: "", tipoFeriadoId: 1, ativo: true });
      invalidateUserMutation(queryClient, "adminFeriado");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { mensagem?: string } }; message?: string })?.response?.data
          ?.mensagem ??
        (err as Error)?.message ??
        "Não foi possível criar o feriado.";
      toast({ variant: "destructive", title: "Erro", description: msg });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (feriadoId: string) => deletarFeriadoAdmin(feriadoId),
    onSuccess: () => {
      toast({ title: "Feriado removido" });
      invalidateUserMutation(queryClient, "adminFeriado");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { mensagem?: string } }; message?: string })?.response?.data
          ?.mensagem ??
        (err as Error)?.message ??
        "Não foi possível remover o feriado.";
      toast({ variant: "destructive", title: "Erro", description: msg });
    },
  });

  const pageData: AdminFeriadoListagemPageResponse | undefined = data;
  const feriados = pageData?.conteudo ?? [];
  const paginacao = pageData?.paginacao;
  const totalPaginas = paginacao?.totalPaginas ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Calendar className="h-5 w-5 text-primary" />
        <div>
          <h1 className="font-display text-xl font-semibold">Feriados globais</h1>
          <p className="text-sm text-muted-foreground">
            Administração de feriados de abrangência nacional, estadual e municipal.
          </p>
        </div>
      </div>

      <Card className={LIST_CARD}>
        <CardHeader className={LIST_CARD_HEADER}>
          <CardTitle className="text-base">Criar feriado</CardTitle>
        </CardHeader>
        <CardContent className={`${LIST_CARD_CONTENT_FLUSH} space-y-3 px-4 py-4 sm:px-5 sm:py-5`}>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="data">Data (yyyy-MM-dd)</Label>
              <Input
                id="data"
                value={novo.data}
                onChange={(e) => setNovo((p) => ({ ...p, data: e.target.value }))}
                placeholder="2026-01-01"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                value={novo.descricao}
                onChange={(e) => setNovo((p) => ({ ...p, descricao: e.target.value }))}
                placeholder="Ano Novo"
              />
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => createMutation.mutate(novo)}
            disabled={createMutation.isPending || !novo.data || !novo.descricao}
          >
            {createMutation.isPending ? "Salvando..." : "Criar feriado"}
          </Button>
        </CardContent>
      </Card>

      <Card className={LIST_CARD}>
        <CardHeader className={LIST_CARD_HEADER}>
          <CardTitle className="text-base">Feriados</CardTitle>
        </CardHeader>
        <CardContent className={`${LIST_CARD_CONTENT_FLUSH} space-y-3 px-4 pb-4 sm:px-5`}>
          {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {!isLoading && feriados.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhum feriado cadastrado.</p>
          )}
          {!isLoading && feriados.length > 0 && (
            <>
              <div className="-mx-4 overflow-x-auto sm:-mx-5">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={TABLE_COL_MD_ONLY}>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className={TABLE_COL_MD_ONLY}>Tipo</TableHead>
                      <TableHead className={TABLE_COL_MD_ONLY}>Ativo</TableHead>
                      <TableHead className="w-[80px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feriados.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell className={TABLE_COL_MD_ONLY}>{f.data}</TableCell>
                        <TableCell className={TABLE_CELL_MAIN_MOBILE}>{f.descricao}</TableCell>
                        <TableCell className={TABLE_COL_MD_ONLY}>{f.tipoFeriadoDescricao}</TableCell>
                        <TableCell className={TABLE_COL_MD_ONLY}>{f.ativo ? "Sim" : "Não"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => deleteMutation.mutate(f.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
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
