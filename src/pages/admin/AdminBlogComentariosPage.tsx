import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ExternalLink, MessageSquare, Trash2 } from "lucide-react";
import { CACHE_MEDIUM, invalidateUserMutation, queryKeys } from "@/lib/query-cache-policy";
import { LIST_CARD, LIST_CARD_CONTENT_FLUSH, LIST_CARD_HEADER, LIST_TABLE_FOOTER } from "@/lib/list-card-layout";
import { formatDataHora } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  aprovarComentarioBlogAdmin,
  excluirComentarioBlogAdmin,
  listarComentariosBlogAdmin,
} from "@/lib/api-admin";
import { BLOG_CATALOG } from "@/content/blog/catalog";
import { blogPostPath } from "@/content/blog/paths";

const TAMANHO_PAGINA = 10;

const tituloPorSlug = new Map(BLOG_CATALOG.map((p) => [p.slug, p.title]));

function mensagemErro(err: unknown, padrao: string): string {
  return (
    (err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem ??
    (err as Error)?.message ??
    padrao
  );
}

export default function AdminBlogComentariosPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [aprovado, setAprovado] = useState(false);
  const [page, setPage] = useState(0);

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.admin.blogComentarios(aprovado, page, TAMANHO_PAGINA),
    queryFn: () => listarComentariosBlogAdmin({ aprovado, page, size: TAMANHO_PAGINA }),
    ...CACHE_MEDIUM,
  });

  const aprovarMutation = useMutation({
    mutationFn: aprovarComentarioBlogAdmin,
    onSuccess: () => {
      toast({ title: "Comentário aprovado" });
      invalidateUserMutation(queryClient, "adminBlogComentario");
    },
    onError: (err: unknown) =>
      toast({ variant: "destructive", title: "Erro", description: mensagemErro(err, "Não foi possível aprovar.") }),
  });

  const excluirMutation = useMutation({
    mutationFn: excluirComentarioBlogAdmin,
    onSuccess: () => {
      toast({ title: aprovado ? "Comentário removido do post" : "Comentário recusado" });
      invalidateUserMutation(queryClient, "adminBlogComentario");
    },
    onError: (err: unknown) =>
      toast({ variant: "destructive", title: "Erro", description: mensagemErro(err, "Não foi possível excluir.") }),
  });

  const itens = data?.conteudo ?? [];
  const paginacao = data?.paginacao;
  const totalPaginas = paginacao?.totalPaginas ?? 1;
  const ocupado = aprovarMutation.isPending || excluirMutation.isPending;

  const trocarAba = (novo: boolean) => {
    setAprovado(novo);
    setPage(0);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <div>
          <h1 className="font-display text-xl font-semibold">Comentários do blog</h1>
          <p className="text-sm text-muted-foreground">
            Comentários só aparecem no post depois de aprovados. Recusar apaga o comentário.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant={aprovado ? "outline" : "default"} size="sm" onClick={() => trocarAba(false)}>
          Pendentes
        </Button>
        <Button variant={aprovado ? "default" : "outline"} size="sm" onClick={() => trocarAba(true)}>
          Aprovados
        </Button>
      </div>

      <Card className={LIST_CARD}>
        <CardHeader className={LIST_CARD_HEADER}>
          <CardTitle className="text-base">
            {aprovado ? "Aprovados" : "Pendentes"}
            {paginacao ? ` (${paginacao.totalElementos})` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className={`${LIST_CARD_CONTENT_FLUSH} space-y-3 px-4 pb-4 sm:px-5`}>
          {isError && <p className="text-sm text-destructive">Não foi possível carregar os comentários.</p>}
          {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {!isLoading && itens.length === 0 && !isError && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {aprovado ? "Nenhum comentário aprovado." : "Nenhum comentário aguardando aprovação."}
            </p>
          )}
          {itens.map((c) => (
            <div key={c.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {c.nome}
                    {c.email ? <span className="font-normal text-muted-foreground"> · {c.email}</span> : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDataHora(c.createdAt)} ·{" "}
                    <a
                      href={blogPostPath(c.postSlug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground"
                    >
                      {tituloPorSlug.get(c.postSlug) ?? c.postSlug}
                      <ExternalLink className="h-3 w-3" aria-hidden />
                    </a>
                  </p>
                </div>
                <div className="flex gap-2">
                  {!aprovado && (
                    <Button
                      size="sm"
                      className="gap-1"
                      disabled={ocupado}
                      onClick={() => aprovarMutation.mutate(c.id)}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Aprovar
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    disabled={ocupado}
                    onClick={() => excluirMutation.mutate(c.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {aprovado ? "Remover" : "Recusar"}
                  </Button>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm">{c.texto}</p>
            </div>
          ))}

          {totalPaginas > 1 && (
            <div className={LIST_TABLE_FOOTER}>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Página {(paginacao?.paginaAtual ?? page) + 1} de {totalPaginas}
              </p>
              <div className="flex justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
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
        </CardContent>
      </Card>
    </div>
  );
}
