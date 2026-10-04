import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, CreditCard } from "lucide-react";
import { LIST_CARD, LIST_CARD_CONTENT_FLUSH, LIST_CARD_HEADER } from "@/lib/list-card-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CACHE_MEDIUM, queryKeys, invalidateUserMutation } from "@/lib/query-cache-policy";
import { editarPlanoEmpresaAdmin, listarEmpresasPlanosAdmin } from "@/lib/api-admin";
import { TIPOS_ASSINATURA } from "@/constants/tipoAssinatura";
import type { AdminEmpresaPlanoResponse } from "@/types/admin";

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export default function AdminEditarPlanoPage() {
  const navigate = useNavigate();
  const { empresaId = "" } = useParams<{ empresaId: string }>();
  const location = useLocation();
  const navState = (location.state as {
    empresa?: AdminEmpresaPlanoResponse;
    username?: string;
    from?: string;
  } | null) ?? null;
  const stateEmpresa = navState?.empresa;
  const stateUsername = navState?.username;
  const backTo = navState?.from === "/admin/empresas" ? "/admin/empresas" : "/admin/planos";
  const backLabel = backTo === "/admin/empresas" ? "Empresas" : "Planos";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [tipoAssinaturaId, setTipoAssinaturaId] = useState("");
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFim, setPeriodoFim] = useState("");

  const { data: planosPage, isLoading: loadingEmpresa } = useQuery({
    queryKey: queryKeys.admin.planosLookup(empresaId),
    queryFn: () => listarEmpresasPlanosAdmin({ page: 0, size: 500 }),
    enabled: !!empresaId && !stateEmpresa,
    ...CACHE_MEDIUM,
  });

  const empresa =
    stateEmpresa?.empresaId === empresaId
      ? stateEmpresa
      : planosPage?.conteudo.find((e) => e.empresaId === empresaId);

  const displayUsername = empresa?.username ?? stateUsername ?? empresaId;

  useEffect(() => {
    if (!empresa) return;
    setTipoAssinaturaId(empresa.tipoAssinaturaId != null ? String(empresa.tipoAssinaturaId) : "");
    setPeriodoInicio(toDateInput(empresa.periodoInicio));
    setPeriodoFim(toDateInput(empresa.periodoFim));
  }, [empresa]);

  const mutation = useMutation({
    mutationFn: () =>
      editarPlanoEmpresaAdmin(empresaId, {
        tipoAssinaturaId: Number(tipoAssinaturaId),
        periodoInicio,
        periodoFim,
      }),
    onSuccess: () => {
      toast({ title: "Plano atualizado" });
      invalidateUserMutation(queryClient, "adminPlano");
      navigate(backTo);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem ??
        (err as Error)?.message ??
        "Não foi possível salvar o plano.";
      toast({ variant: "destructive", title: "Erro", description: msg });
    },
  });

  const podeSalvar =
    !!empresaId &&
    !!tipoAssinaturaId &&
    !!periodoInicio &&
    !!periodoFim &&
    periodoFim >= periodoInicio &&
    !mutation.isPending;

  if (!empresaId) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">Empresa inválida.</p>
        <Button variant="outline" onClick={() => navigate(backTo)}>
          Voltar
        </Button>
      </div>
    );
  }

  if (loadingEmpresa && !stateEmpresa) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  if (!empresa) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">Empresa não encontrada.</p>
        <Button variant="outline" onClick={() => navigate(backTo)}>
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={() => navigate(backTo)}
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> {backLabel}
        </Button>
        <Button onClick={() => mutation.mutate()} disabled={!podeSalvar}>
          {mutation.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Editar plano</h1>
        <p className="text-sm text-muted-foreground">
          Empresa <span className="font-medium text-foreground">{displayUsername}</span>.
          Define plano e período (acesso liberado até a data fim).
        </p>
      </div>

      <Card className={LIST_CARD}>
        <CardHeader className={LIST_CARD_HEADER}>
          <CardTitle className="flex items-center gap-2 font-display text-base">
            <CreditCard className="h-5 w-5 shrink-0 text-landing-cta" strokeWidth={1.75} />
            Plano e vigência
          </CardTitle>
        </CardHeader>
        <CardContent className={`${LIST_CARD_CONTENT_FLUSH} space-y-4 px-4 py-4 sm:px-5 sm:py-5`}>
          <div className="space-y-2 sm:max-w-md">
            <Label htmlFor="plano">Plano</Label>
            <Select value={tipoAssinaturaId || undefined} onValueChange={setTipoAssinaturaId}>
              <SelectTrigger id="plano">
                <SelectValue placeholder="Selecione o plano" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_ASSINATURA.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.nome} — {p.priceDisplay}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:max-w-md sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="inicio">Data início</Label>
              <Input
                id="inicio"
                type="date"
                value={periodoInicio}
                onChange={(e) => setPeriodoInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fim">Data fim</Label>
              <Input
                id="fim"
                type="date"
                value={periodoFim}
                onChange={(e) => setPeriodoFim(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end border-t border-border pt-4">
        <Button onClick={() => mutation.mutate()} disabled={!podeSalvar}>
          {mutation.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
