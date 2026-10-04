import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, ChevronLeft, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { LIST_CARD, LIST_CARD_CONTENT_FLUSH, LIST_CARD_HEADER } from "@/lib/list-card-layout";
import { FieldExpectedStatus } from "@/components/ui/field-with-expected";
import { useToast } from "@/hooks/use-toast";
import { CACHE_MEDIUM, invalidateUserMutation, queryKeys } from "@/lib/query-cache-policy";
import { useValidation } from "@/hooks/useValidation";
import { useEstadosCidades } from "@/lib/useEstadosCidades";
import { atualizarEmpresaAdmin, excluirJornadaConfigEmpresaAdmin, getPerfilEmpresaAdmin } from "@/lib/api-admin";
import type { AdminAtualizarEmpresaRequest } from "@/types/admin";
import {
  validateUsername,
  validateEmail,
  validateCodigoPais,
  validateDdd,
  validateNumeroTelefone,
  validateRua,
  validateNumeroEndereco,
  validateComplemento,
  validateBairro,
  validateCidade,
  validateUf,
  validateCep,
  validateDurationHhmm,
  validateDurationHhmmCargaDiaria,
  validateDurationHhmmTolerancia,
  validateTimezone,
  validateNomeCompleto,
} from "@/lib/validations";
import {
  durationToHHmm,
  hhmmToDuration,
  clampDurationHHmmTo44,
  clampDurationHHmmTo6,
  clampDurationHHmmTo12,
} from "@/lib/duration";
import { getBrowserTimezone } from "@/lib/utils";
import {
  formatCnpj,
  formatTitleCase,
  maskCepInput,
  maskDddInput,
  maskNumeroTelefoneInput,
  maskNumeroEnderecoInput,
  maskUsernameInput,
  maskEmailInput,
} from "@/lib/format";

export default function AdminEditarEmpresaPage() {
  const navigate = useNavigate();
  const { empresaId = "" } = useParams<{ empresaId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getError, handleBlur, handleChange, validateAll, clearAll } = useValidation();
  const { estados, getCidadesByUf, loading: loadingEstados } = useEstadosCidades();

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.admin.empresaPerfil(empresaId),
    queryFn: () => getPerfilEmpresaAdmin(empresaId),
    enabled: !!empresaId,
    ...CACHE_MEDIUM,
  });

  const [form, setForm] = useState({
    username: "",
    razaoSocial: "",
    email: "",
    codigoPais: "55",
    ddd: "",
    numero: "",
    rua: "",
    numeroEndereco: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    cep: "",
    cargaDiariaPadrao: "",
    cargaSemanalPadrao: "",
    toleranciaPadrao: "",
    timezone: getBrowserTimezone(),
    gravarGeolocalizacaoObrigatoria: false,
    gravaPontoApenasEmGeofence: false,
    permitirAjustePontoDireto: false,
  });
  const [durationDisplays, setDurationDisplays] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!data) return;
    setDurationDisplays({
      cargaDiariaPadrao: durationToHHmm(data.cargaDiariaPadrao ?? ""),
      cargaSemanalPadrao: durationToHHmm(data.cargaSemanalPadrao ?? ""),
      toleranciaPadrao: durationToHHmm(data.toleranciaPadrao ?? "PT0S"),
    });
    setForm({
      username: data.username ?? "",
      razaoSocial: data.razaoSocial ?? "",
      email: data.email ?? "",
      codigoPais: data.codigoPais ?? "55",
      ddd: data.ddd ?? "",
      numero: data.numero ?? "",
      rua: data.rua ?? "",
      numeroEndereco: data.numeroEndereco ?? "",
      complemento: data.complemento ?? "",
      bairro: data.bairro ?? "",
      cidade: data.cidade ?? "",
      uf: (data.uf ?? "").toUpperCase(),
      cep: data.cep ?? "",
      cargaDiariaPadrao: data.cargaDiariaPadrao ?? "",
      cargaSemanalPadrao: data.cargaSemanalPadrao ?? "",
      toleranciaPadrao: data.toleranciaPadrao ?? "",
      timezone: data.timezone ?? getBrowserTimezone(),
      gravarGeolocalizacaoObrigatoria: data.gravarGeolocalizacaoObrigatoria ?? false,
      gravaPontoApenasEmGeofence: data.gravaPontoApenasEmGeofence ?? false,
      permitirAjustePontoDireto: data.permitirAjustePontoDireto ?? false,
    });
    clearAll();
    setHydrated(true);
  }, [data, clearAll]);

  const cidades = getCidadesByUf(form.uf);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!data) return;
      const ok = validateAll([
        ["username", form.username, (v) => validateUsername(v, true)],
        ["razaoSocial", form.razaoSocial, (v) => validateNomeCompleto(v, true)],
        ["email", form.email, (v) => validateEmail(v, true)],
        ["codigoPais", form.codigoPais, (v) => validateCodigoPais(v, true)],
        ["ddd", form.ddd, (v) => validateDdd(v, true)],
        ["numero", form.numero, (v) => validateNumeroTelefone(v, true)],
        ["rua", form.rua, (v) => validateRua(v, true)],
        ["numeroEndereco", form.numeroEndereco, (v) => validateNumeroEndereco(v, true)],
        ["complemento", form.complemento, validateComplemento],
        ["bairro", form.bairro, (v) => validateBairro(v, true)],
        ["cidade", form.cidade, (v) => validateCidade(v, true)],
        ["uf", form.uf, (v) => validateUf(v, true)],
        ["cep", form.cep, (v) => validateCep(v, true)],
        ["cargaDiariaPadrao", durationToHHmm(form.cargaDiariaPadrao ?? ""), (v) => validateDurationHhmmCargaDiaria(v)],
        ["cargaSemanalPadrao", durationToHHmm(form.cargaSemanalPadrao ?? ""), (v) => validateDurationHhmm(v, true, "Carga semanal")],
        ["toleranciaPadrao", durationToHHmm(form.toleranciaPadrao ?? "PT0S"), (v) => validateDurationHhmmTolerancia(v, true)],
        ["timezone", form.timezone, (v) => validateTimezone(v, true)],
      ]);
      if (!ok) {
        toast({ variant: "destructive", title: "Corrija os erros antes de salvar." });
        return;
      }

      const body: AdminAtualizarEmpresaRequest = {
        username: form.username.trim(),
        razaoSocial: form.razaoSocial.trim(),
        email: form.email.trim().toLowerCase(),
        telefone: {
          codigoPais: form.codigoPais.replace(/\D/g, "").trim(),
          ddd: form.ddd.replace(/\D/g, "").trim(),
          numero: form.numero.replace(/\D/g, "").trim(),
        },
        endereco: {
          rua: form.rua.trim(),
          numero: form.numeroEndereco.replace(/\D/g, "") || form.numeroEndereco,
          complemento: form.complemento?.trim() || null,
          bairro: form.bairro.trim(),
          cidade: form.cidade.trim(),
          uf: form.uf.toUpperCase(),
          cep: form.cep.replace(/\D/g, ""),
        },
        jornada: {
          tipoEscalaJornadaId: 1,
          cargaHorariaDiaria: form.cargaDiariaPadrao,
          cargaHorariaSemanal: form.cargaSemanalPadrao,
          toleranciaPadrao: form.toleranciaPadrao || "PT0S",
          tempoDescansoEntreJornada: "PT11H",
          entradaPadrao: "08:00",
          saidaPadrao: "17:00",
          timezone: form.timezone || getBrowserTimezone(),
          gravaGeoObrigatoria: form.gravarGeolocalizacaoObrigatoria,
          gravaPontoApenasEmGeofence: form.gravaPontoApenasEmGeofence,
          permiteAjustePonto: form.permitirAjustePontoDireto,
        },
      };
      await atualizarEmpresaAdmin(empresaId, body);
    },
    onSuccess: async () => {
      invalidateUserMutation(queryClient, "adminEmpresa");
      toast({ title: "Empresa atualizada.", description: "As alterações foram salvas." });
      navigate("/admin/empresas");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { mensagem?: string } }; message?: string })?.response?.data
          ?.mensagem ?? (err as Error)?.message;
      toast({ variant: "destructive", title: "Erro ao salvar", description: msg });
    },
  });

  const excluirJornadaMutation = useMutation({
    mutationFn: () => excluirJornadaConfigEmpresaAdmin(empresaId),
    onSuccess: async () => {
      invalidateUserMutation(queryClient, "adminEmpresa");
      toast({
        title: "Onboarding reativado.",
        description: "A jornada padrão foi removida. A empresa precisará configurar de novo.",
      });
      navigate("/admin/empresas");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { mensagem?: string } }; message?: string })?.response?.data
          ?.mensagem ?? (err as Error)?.message;
      toast({ variant: "destructive", title: "Erro ao excluir jornada", description: msg });
    },
  });

  const handleExcluirJornada = () => {
    const nome = form.razaoSocial || data?.username || "esta empresa";
    const ok = window.confirm(
      `Excluir a jornada padrão de "${nome}"? Isso reativa o onboarding (configuração inicial) para a empresa.`,
    );
    if (!ok) return;
    excluirJornadaMutation.mutate();
  };

  if (!empresaId) {
    return <p className="text-sm text-destructive">Empresa inválida.</p>;
  }

  if (isLoading || !hydrated) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">Não foi possível carregar a empresa.</p>
        <Button variant="outline" onClick={() => navigate("/admin/empresas")}>
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
          onClick={() => navigate("/admin/empresas")}
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Empresas
        </Button>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Editar empresa</h1>
        <p className="text-sm text-muted-foreground">
          Dados cadastrais, telefone, endereço e jornada padrão.
        </p>
      </div>

      <Card className={LIST_CARD}>
        <CardHeader className={LIST_CARD_HEADER}>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Building2 className="h-5 w-5" />
            Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className={`${LIST_CARD_CONTENT_FLUSH} space-y-4 px-4 py-4 sm:px-5 sm:py-5`}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div>
              <Label className="text-sm font-medium">CNPJ</Label>
              <Input value={data.cnpj ? formatCnpj(data.cnpj) : ""} disabled className="mt-1 h-10 bg-muted" />
            </div>
            <div>
              <Label className="text-sm font-medium" required>
                Razão social
              </Label>
              <Input
                value={form.razaoSocial}
                onChange={(e) => {
                  const formatted = formatTitleCase(e.target.value);
                  setForm((p) => ({ ...p, razaoSocial: formatted }));
                  handleChange("razaoSocial", formatted, (v) => validateNomeCompleto(v, true));
                }}
                onBlur={() => handleBlur("razaoSocial", form.razaoSocial, (v) => validateNomeCompleto(v, true))}
                className="mt-1 h-10"
                aria-invalid={!!getError("razaoSocial")}
              />
              <FieldExpectedStatus error={getError("razaoSocial")} />
            </div>
            <div>
              <Label className="text-sm font-medium" required>
                Username
              </Label>
              <Input
                value={form.username}
                onChange={(e) => {
                  const next = maskUsernameInput(e.target.value);
                  setForm((p) => ({ ...p, username: next }));
                  handleChange("username", next, (v) => validateUsername(v, true));
                }}
                onBlur={() => handleBlur("username", form.username, (v) => validateUsername(v, true))}
                className="mt-1 h-10"
                aria-invalid={!!getError("username")}
              />
              <FieldExpectedStatus error={getError("username")} />
            </div>
            <div>
              <Label className="text-sm font-medium" required>
                E-mail
              </Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => {
                  const next = maskEmailInput(e.target.value);
                  setForm((p) => ({ ...p, email: next }));
                  handleChange("email", next, (v) => validateEmail(v, true));
                }}
                onBlur={() => handleBlur("email", form.email, (v) => validateEmail(v, true))}
                className="mt-1 h-10"
                aria-invalid={!!getError("email")}
              />
              <FieldExpectedStatus error={getError("email")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={LIST_CARD}>
        <CardHeader className={LIST_CARD_HEADER}>
          <CardTitle className="text-base font-semibold">Telefone</CardTitle>
        </CardHeader>
        <CardContent className={`${LIST_CARD_CONTENT_FLUSH} space-y-4 px-4 py-4 sm:px-5 sm:py-5`}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:gap-4">
            <div>
              <Label className="text-sm font-medium" required>
                Código País
              </Label>
              <Input
                value={form.codigoPais}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 3);
                  setForm((p) => ({ ...p, codigoPais: v }));
                  handleChange("codigoPais", v, (x) => validateCodigoPais(x, true));
                }}
                className="mt-1 h-10"
              />
              <FieldExpectedStatus error={getError("codigoPais")} />
            </div>
            <div>
              <Label className="text-sm font-medium" required>
                DDD
              </Label>
              <Input
                value={form.ddd}
                onChange={(e) => {
                  const next = maskDddInput(e.target.value);
                  setForm((p) => ({ ...p, ddd: next }));
                  handleChange("ddd", next, (v) => validateDdd(v, true));
                }}
                className="mt-1 h-10"
              />
              <FieldExpectedStatus error={getError("ddd")} />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-sm font-medium" required>
                Número
              </Label>
              <Input
                value={form.numero}
                onChange={(e) => {
                  const next = maskNumeroTelefoneInput(e.target.value);
                  setForm((p) => ({ ...p, numero: next }));
                  handleChange("numero", next, (v) => validateNumeroTelefone(v, true));
                }}
                className="mt-1 h-10"
              />
              <FieldExpectedStatus error={getError("numero")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={LIST_CARD}>
        <CardHeader className={LIST_CARD_HEADER}>
          <CardTitle className="text-base font-semibold">Endereço</CardTitle>
        </CardHeader>
        <CardContent className={`${LIST_CARD_CONTENT_FLUSH} space-y-4 px-4 py-4 sm:px-5 sm:py-5`}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <div className="sm:col-span-2">
              <Label className="text-sm font-medium" required>
                Rua
              </Label>
              <Input
                value={form.rua}
                onChange={(e) => {
                  const formatted = formatTitleCase(e.target.value);
                  setForm((p) => ({ ...p, rua: formatted }));
                  handleChange("rua", formatted, (v) => validateRua(v, true));
                }}
                className="mt-1 h-10"
              />
              <FieldExpectedStatus error={getError("rua")} />
            </div>
            <div>
              <Label className="text-sm font-medium" required>
                Número
              </Label>
              <Input
                value={form.numeroEndereco}
                onChange={(e) => {
                  const next = maskNumeroEnderecoInput(e.target.value);
                  setForm((p) => ({ ...p, numeroEndereco: next }));
                  handleChange("numeroEndereco", next, (v) => validateNumeroEndereco(v, true));
                }}
                className="mt-1 h-10"
              />
              <FieldExpectedStatus error={getError("numeroEndereco")} />
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Complemento</Label>
            <Input
              value={form.complemento}
              onChange={(e) => {
                const formatted = formatTitleCase(e.target.value);
                setForm((p) => ({ ...p, complemento: formatted }));
                handleChange("complemento", formatted, validateComplemento);
              }}
              className="mt-1 h-10"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div>
              <Label className="text-sm font-medium" required>
                Estado
              </Label>
              <Select
                value={form.uf || undefined}
                onValueChange={(v) => {
                  setForm((p) => ({ ...p, uf: v, cidade: "" }));
                  handleChange("uf", v, (x) => validateUf(x, true));
                }}
                disabled={loadingEstados}
              >
                <SelectTrigger className="mt-1 h-10">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {estados.map((e) => (
                    <SelectItem key={e.sigla} value={e.sigla}>
                      {e.nomeEstado} - {e.sigla}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium" required>
                Cidade
              </Label>
              <Select
                value={form.cidade || undefined}
                onValueChange={(v) => {
                  setForm((p) => ({ ...p, cidade: v }));
                  handleChange("cidade", v, (x) => validateCidade(x, true));
                }}
                disabled={!form.uf || cidades.length === 0}
              >
                <SelectTrigger className="mt-1 h-10">
                  <SelectValue placeholder={form.uf ? "Selecione" : "Estado primeiro"} />
                </SelectTrigger>
                <SelectContent>
                  {cidades.map((c) => (
                    <SelectItem key={c.id_cidade} value={c.nomeCidade}>
                      {c.nomeCidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div>
              <Label className="text-sm font-medium" required>
                Bairro
              </Label>
              <Input
                value={form.bairro}
                onChange={(e) => {
                  const formatted = formatTitleCase(e.target.value);
                  setForm((p) => ({ ...p, bairro: formatted }));
                  handleChange("bairro", formatted, (v) => validateBairro(v, true));
                }}
                className="mt-1 h-10"
              />
            </div>
            <div>
              <Label className="text-sm font-medium" required>
                CEP
              </Label>
              <Input
                value={form.cep}
                onChange={(e) => {
                  const next = maskCepInput(e.target.value);
                  setForm((p) => ({ ...p, cep: next }));
                  handleChange("cep", next, (v) => validateCep(v, true));
                }}
                className="mt-1 h-10"
              />
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium" required>
              Timezone
            </Label>
            <Input
              value={form.timezone}
              onChange={(e) => {
                setForm((p) => ({ ...p, timezone: e.target.value }));
                handleChange("timezone", e.target.value, (v) => validateTimezone(v, true));
              }}
              className="mt-1 h-10 sm:max-w-md"
            />
          </div>
        </CardContent>
      </Card>

      <Card className={LIST_CARD}>
        <CardHeader className={LIST_CARD_HEADER}>
          <div className="flex w-full items-center justify-between gap-2">
            <CardTitle className="text-base font-semibold">Jornada padrão</CardTitle>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0 gap-1 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              title="Remove a jornada e reativa o onboarding"
              onClick={handleExcluirJornada}
              disabled={excluirJornadaMutation.isPending || mutation.isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {excluirJornadaMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className={`${LIST_CARD_CONTENT_FLUSH} space-y-4 px-4 py-4 sm:px-5 sm:py-5`}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {(
              [
                ["cargaDiariaPadrao", "Carga diária", clampDurationHHmmTo12, validateDurationHhmmCargaDiaria],
                ["cargaSemanalPadrao", "Carga semanal", clampDurationHHmmTo44, (v: string) => validateDurationHhmm(v, true, "Carga semanal")],
                ["toleranciaPadrao", "Tolerância", clampDurationHHmmTo6, (v: string) => validateDurationHhmmTolerancia(v, true)],
              ] as const
            ).map(([key, label, clamp, validate]) => (
              <div key={key}>
                <Label className="text-sm font-medium" required>
                  {label}
                </Label>
                <Input
                  value={durationDisplays[key] ?? durationToHHmm(form[key] ?? "")}
                  onChange={(e) => {
                    const v = clamp(e.target.value);
                    setDurationDisplays((p) => ({ ...p, [key]: v }));
                    handleChange(key, v, validate);
                  }}
                  onBlur={() => {
                    const d = durationDisplays[key] ?? durationToHHmm(form[key] ?? "");
                    const iso = hhmmToDuration(d) || (key === "toleranciaPadrao" ? "PT0S" : "");
                    setForm((p) => ({ ...p, [key]: iso }));
                    setDurationDisplays((p) => ({ ...p, [key]: durationToHHmm(iso) }));
                    handleBlur(key, durationToHHmm(iso), validate);
                  }}
                  className="mt-1 h-10"
                  maxLength={5}
                />
              </div>
            ))}
            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={form.gravarGeolocalizacaoObrigatoria}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, gravarGeolocalizacaoObrigatoria: !!v }))}
                />
                <Label className="text-sm font-medium">Geolocalização obrigatória</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={form.gravaPontoApenasEmGeofence}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, gravaPontoApenasEmGeofence: !!v }))}
                />
                <Label className="text-sm font-medium">Ponto apenas em geofence</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={form.permitirAjustePontoDireto}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, permitirAjustePontoDireto: !!v }))}
                />
                <Label className="text-sm font-medium">Permitir ajuste de ponto direto</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end border-t border-border pt-4">
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
