import { LIST_CARD, LIST_CARD_CONTENT_FLUSH, LIST_CARD_HEADER, LIST_TABLE_FOOTER } from "@/lib/list-card-layout";
import { cn } from "@/lib/utils";
import { TABLE_CELL_MAIN_MOBILE, TABLE_COL_MD_ONLY } from "@/lib/table-responsive";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CACHE_MEDIUM, queryKeys, invalidateUserMutation } from "@/lib/query-cache-policy";
import { useValidation } from "@/hooks/useValidation";
import { validateSenha } from "@/lib/validations";
import {
  listarUsuariosAdmin,
  desbloquearUsuario,
  deletarUsuarioAdmin,
  resetarSenhaUsuarioAdmin,
} from "@/lib/api-admin";
import type { AdminUsuarioListagemResponse } from "@/types/admin";
import { KeyRound, Trash2, Unlock, Users } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function AdminUsuariosPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getError, handleBlur, handleChange, clearError } = useValidation();
  const [page, setPage] = useState(0);
  const size = 10;
  const [resetSenhaTarget, setResetSenhaTarget] = useState<AdminUsuarioListagemResponse | null>(null);
  const [senhaNova, setSenhaNova] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.admin.usuarios(page, size),
    queryFn: () => listarUsuariosAdmin({ page, size }),
    ...CACHE_MEDIUM,
  });

  const desbloquearMutation = useMutation({
    mutationFn: (usuarioId: string) => desbloquearUsuario(usuarioId),
    onSuccess: () => {
      toast({ title: "Usuário desbloqueado" });
      invalidateUserMutation(queryClient, "adminUsuario");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { mensagem?: string } }; message?: string })?.response?.data
          ?.mensagem ??
        (err as Error)?.message ??
        "Não foi possível desbloquear o usuário.";
      toast({ variant: "destructive", title: "Erro ao desbloquear", description: msg });
    },
  });

  const resetSenhaMutation = useMutation({
    mutationFn: ({ id, senhaNova }: { id: string; senhaNova: string }) =>
      resetarSenhaUsuarioAdmin(id, { senhaNova }),
    onSuccess: () => {
      toast({ title: "Senha alterada" });
      setResetSenhaTarget(null);
      setSenhaNova("");
      clearError("resetSenhaNova");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { mensagem?: string } }; message?: string })?.response?.data
          ?.mensagem ??
        (err as Error)?.message ??
        "Não foi possível alterar a senha.";
      toast({ variant: "destructive", title: "Erro ao alterar senha", description: msg });
    },
  });

  const deletarMutation = useMutation({
    mutationFn: (usuarioId: string) => deletarUsuarioAdmin(usuarioId),
    onSuccess: () => {
      toast({ title: "Usuário excluído" });
      invalidateUserMutation(queryClient, "adminUsuario");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { mensagem?: string } }; message?: string })?.response?.data
          ?.mensagem ??
        (err as Error)?.message ??
        "Não foi possível excluir o usuário.";
      toast({ variant: "destructive", title: "Erro ao excluir", description: msg });
    },
  });

  const usuarios = data?.conteudo ?? [];
  const paginacao = data?.paginacao;
  const totalPaginas = paginacao?.totalPaginas ?? 1;
  const busy =
    desbloquearMutation.isPending || deletarMutation.isPending || resetSenhaMutation.isPending;

  const handleDesbloquear = (u: AdminUsuarioListagemResponse) => {
    desbloquearMutation.mutate(u.usuarioId);
  };

  const handleExcluir = (u: AdminUsuarioListagemResponse) => {
    if (u.tipo === "ADMIN") return;
    const ok = window.confirm(
      `Excluir permanentemente o usuário "${u.username}"? Esta ação não pode ser desfeita.`,
    );
    if (!ok) return;
    deletarMutation.mutate(u.usuarioId);
  };

  const openResetSenha = (u: AdminUsuarioListagemResponse) => {
    setSenhaNova("");
    clearError("resetSenhaNova");
    setResetSenhaTarget(u);
  };

  if (isError && error) {
    const msg =
      (error as { response?: { data?: { mensagem?: string } }; message?: string })?.response?.data
        ?.mensagem ??
      (error as Error)?.message ??
      "Erro ao carregar usuários.";
    toast({ variant: "destructive", title: "Erro", description: msg });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <div>
          <h1 className="font-display text-xl font-semibold">Usuários</h1>
          <p className="text-sm text-muted-foreground">
            Listagem de usuários do sistema (EMPRESA, FUNCIONARIO, ADMIN).
          </p>
        </div>
      </div>

      <Card className={LIST_CARD}>
        <CardHeader className={LIST_CARD_HEADER}>
          <CardTitle className="text-base">Usuários</CardTitle>
        </CardHeader>
        <CardContent className={`${LIST_CARD_CONTENT_FLUSH} space-y-3 px-4 pb-4 sm:px-5`}>
          {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {!isLoading && usuarios.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
          )}
          {!isLoading && usuarios.length > 0 && (
            <>
              <div className="-mx-4 overflow-x-auto sm:-mx-5">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead className={TABLE_COL_MD_ONLY}>Tipo</TableHead>
                      <TableHead className={TABLE_COL_MD_ONLY}>E-mails</TableHead>
                      <TableHead className={TABLE_COL_MD_ONLY}>Telefones</TableHead>
                      <TableHead className="min-w-[260px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuarios.map((u) => (
                      <TableRow key={u.usuarioId}>
                        <TableCell className={cn("font-medium", TABLE_CELL_MAIN_MOBILE)}>
                          {u.username}
                        </TableCell>
                        <TableCell className={TABLE_COL_MD_ONLY}>{u.tipo}</TableCell>
                        <TableCell className={TABLE_COL_MD_ONLY}>
                          {u.emails && u.emails.length > 0 ? u.emails.join(", ") : "—"}
                        </TableCell>
                        <TableCell className={TABLE_COL_MD_ONLY}>
                          {u.telefones && u.telefones.length > 0
                            ? u.telefones
                                .map((t) => `+${t.codigoPais} (${t.ddd}) ${t.numero}`)
                                .join(" | ")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={() => openResetSenha(u)}
                              disabled={busy}
                            >
                              <KeyRound className="h-3 w-3" />
                              Senha
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={() => handleDesbloquear(u)}
                              disabled={busy}
                            >
                              <Unlock className="h-3 w-3" />
                              Desbloquear
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              title={
                                u.tipo === "ADMIN"
                                  ? "Contas de administrador não podem ser excluídas"
                                  : "Excluir permanentemente"
                              }
                              onClick={() => handleExcluir(u)}
                              disabled={u.tipo === "ADMIN" || busy}
                            >
                              <Trash2 className="h-3 w-3" />
                              Excluir
                            </Button>
                          </div>
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

      <Dialog
        open={!!resetSenhaTarget}
        onOpenChange={(open) => {
          if (!open) {
            setResetSenhaTarget(null);
            setSenhaNova("");
            clearError("resetSenhaNova");
          }
        }}
      >
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Alterar senha</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Nova senha para <strong>{resetSenhaTarget?.username}</strong>
          </p>
          <div className="space-y-2">
            <Label htmlFor="admin-reset-senha">Nova senha</Label>
            <Input
              id="admin-reset-senha"
              type="password"
              autoComplete="new-password"
              value={senhaNova}
              onChange={(e) => {
                setSenhaNova(e.target.value);
                handleChange("resetSenhaNova", e.target.value, (v) =>
                  validateSenha(v, true, "Nova senha"),
                );
              }}
              onBlur={() =>
                handleBlur("resetSenhaNova", senhaNova, (v) => validateSenha(v, true, "Nova senha"))
              }
              placeholder="••••••••"
              aria-invalid={!!getError("resetSenhaNova")}
            />
            {getError("resetSenhaNova") && (
              <p className="text-sm text-destructive">{getError("resetSenhaNova")}</p>
            )}
            {!getError("resetSenhaNova") && senhaNova.length > 0 && (
              <p className="flex items-center gap-1 text-sm text-green-600 dark:text-green-500">
                Válido
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetSenhaTarget(null)}>
              Cancelar
            </Button>
            <Button
              disabled={
                !senhaNova.trim() || !!getError("resetSenhaNova") || resetSenhaMutation.isPending
              }
              onClick={() =>
                resetSenhaTarget &&
                resetSenhaMutation.mutate({ id: resetSenhaTarget.usuarioId, senhaNova })
              }
            >
              {resetSenhaMutation.isPending ? "Salvando…" : "Alterar senha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
