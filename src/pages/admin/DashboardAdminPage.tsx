import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CACHE_LONG, queryKeys } from "@/lib/query-cache-policy";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Briefcase, Building2 } from "lucide-react";
import { LimeLineChart } from "@/components/charts/native-lime-charts";
import {
  type AdminEmpresasCadastroPreset,
  obterEmpresasCadastroMetricasPorPeriodoAdmin,
  obterEmpresasCadastroPeriodoOpcoesAdmin,
} from "@/lib/api-admin";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";

export default function DashboardAdminPage() {
  type PeriodKey =
    | "ULTIMOS_7_DIAS"
    | "ULTIMOS_28_DIAS"
    | "ULTIMOS_90_DIAS"
    | "ULTIMOS_365_DIAS"
    | "TODO_PERIODO"
    | `ANO_${number}`
    | `MES_${number}`
    | "PERSONALIZADO";

  const [periodKey, setPeriodKey] = useState<PeriodKey>("ULTIMOS_7_DIAS");
  const [customOpen, setCustomOpen] = useState(false);
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [customDraft, setCustomDraft] = useState<DateRange | undefined>();

  const { data: opcoes } = useQuery({
    queryKey: queryKeys.admin.metricasOpcoes(),
    queryFn: () => obterEmpresasCadastroPeriodoOpcoesAdmin(),
    ...CACHE_LONG,
  });

  const metricasParams = useMemo(() => {
    if (periodKey === "PERSONALIZADO") {
      if (!customRange?.from || !customRange?.to) return { preset: "ULTIMOS_7_DIAS" as AdminEmpresasCadastroPreset };
      const inicio = format(customRange.from, "yyyy-MM-dd");
      const fim = format(customRange.to, "yyyy-MM-dd");
      return { inicio, fim };
    }
    if (periodKey.startsWith("ANO_")) {
      const ano = Number(periodKey.replace("ANO_", ""));
      return { ano };
    }
    if (periodKey.startsWith("MES_")) {
      const mes = Number(periodKey.replace("MES_", ""));
      return { mes };
    }
    return { preset: periodKey as AdminEmpresasCadastroPreset };
  }, [periodKey, customRange]);

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.admin.metricasPeriodo(metricasParams),
    queryFn: () => obterEmpresasCadastroMetricasPorPeriodoAdmin(metricasParams),
    ...CACHE_LONG,
  });

  const chartData = useMemo(() => {
    if (!data) return [] as Array<{ data: string; total: number }>;
    return data.pontos.map((p) => ({ data: p.data, total: p.total }));
  }, [data]);

  const monthName = (m: number) =>
    ([
      "janeiro",
      "fevereiro",
      "março",
      "abril",
      "maio",
      "junho",
      "julho",
      "agosto",
      "setembro",
      "outubro",
      "novembro",
      "dezembro",
    ] as const)[m - 1] ?? `mês ${m}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Visão geral (Admin)</h1>
          <p className="text-sm text-muted-foreground">
            Ferramentas de administração do sistema: usuários, feriados e cobrança por uso.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-5 w-5" />
            Empresas cadastradas
          </CardTitle>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Select
              value={periodKey}
              onValueChange={(v) => {
                const next = v as PeriodKey;
                setPeriodKey(next);
                if (next === "PERSONALIZADO") {
                  setCustomDraft(customRange);
                  setCustomOpen(true);
                } else {
                  setCustomOpen(false);
                }
              }}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ULTIMOS_7_DIAS">Últimos 7 dias</SelectItem>
                <SelectItem value="ULTIMOS_28_DIAS">Últimos 28 dias</SelectItem>
                <SelectItem value="ULTIMOS_90_DIAS">Últimos 90 dias</SelectItem>
                <SelectItem value="ULTIMOS_365_DIAS">Últimos 365 dias</SelectItem>
                <SelectItem value="TODO_PERIODO">Todo o período</SelectItem>
                {(opcoes?.anos ?? []).map((a) => (
                  <SelectItem key={a} value={`ANO_${a}`}>
                    {a}
                  </SelectItem>
                ))}
                {(opcoes?.mesesAnoAtual ?? []).map((m) => (
                  <SelectItem key={m} value={`MES_${m}`}>
                    {monthName(m)}
                  </SelectItem>
                ))}
                <SelectItem value="PERSONALIZADO">Personalizado</SelectItem>
              </SelectContent>
            </Select>

            <Popover open={customOpen} onOpenChange={setCustomOpen}>
              <PopoverTrigger asChild>
                <Button className="hidden" variant="outline" />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4" align="end">
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      readOnly
                      value={customDraft?.from ? format(customDraft.from, "dd/MM/yyyy") : ""}
                      placeholder="Início"
                    />
                    <Input
                      readOnly
                      value={customDraft?.to ? format(customDraft.to, "dd/MM/yyyy") : ""}
                      placeholder="Fim"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Período selecionado:{" "}
                    {customDraft?.from && customDraft?.to
                      ? `${Math.max(
                          1,
                          Math.floor(
                            (customDraft.to.getTime() - customDraft.from.getTime()) / (1000 * 60 * 60 * 24),
                          ) + 1,
                        )} dias`
                      : "—"}
                  </p>
                  <CalendarComponent
                    mode="range"
                    selected={customDraft}
                    onSelect={setCustomDraft}
                    numberOfMonths={1}
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCustomDraft(customRange);
                        setCustomOpen(false);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => {
                        setCustomRange(customDraft);
                        setCustomOpen(false);
                      }}
                      disabled={!customDraft?.from || !customDraft?.to}
                    >
                      Usar
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          {isError ? (
            <p className="text-sm text-destructive">Não foi possível carregar as métricas.</p>
          ) : isLoading || !data ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <LimeLineChart
              points={chartData.map((p) => ({ label: p.data, value: p.total }))}
              yAxisWidth={32}
              yMinFloor={1}
              yTickFormatter={(v) => String(Math.round(v))}
              tooltipFormat={(v) => String(v)}
              xTickFormatter={(v) => (v.length >= 10 ? `${v.slice(8, 10)}/${v.slice(5, 7)}` : v)}
            />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5" />
              Usuários
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              Listar usuários do sistema, criar novos admins e desbloquear contas.
            </p>
            <Button asChild size="sm">
              <Link to="/admin/usuarios">Gerenciar usuários</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-5 w-5" />
              Empresas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              Funcionários por empresa. Cobrança via assinatura recorrente automática (AbacatePay).
            </p>
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/empresas">Abrir empresas</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-5 w-5" />
              Feriados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              Cadastrar e editar feriados nacionais, estaduais e municipais para empresas.
            </p>
            <div className="flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to="/admin/feriados">Globais</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/admin/feriados-empresa">Por empresa</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

