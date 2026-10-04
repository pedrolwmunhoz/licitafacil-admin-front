import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowDown, ArrowUp, Loader2 } from "lucide-react";
import type { DateRange } from "react-day-picker";
import type { ReactNode } from "react";
import { LimeLineChart } from "@/components/charts/native-lime-charts";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BLOG_CATALOG } from "@/content/blog/catalog";
import { blogCapaPath, blogPostPath, formatBlogDate } from "@/content/blog/paths";
import {
  obterBlogMetricasConteudoAdmin,
  obterBlogMetricasOrigensAdmin,
  obterBlogMetricasOverviewAdmin,
  obterBlogMetricasTopConteudoAdmin,
} from "@/lib/api-admin";
import { CACHE_MEDIUM, queryKeys } from "@/lib/query-cache-policy";
import { cn } from "@/lib/utils";
import type {
  AdminBlogMetricaConteudoTipo,
  AdminBlogMetricaOverviewTipo,
  AdminBlogMetricaPeriodo,
  AdminBlogMetricasPeriodoParams,
} from "@/types/admin";

type PeriodKey =
  | "ULTIMOS_7"
  | "ULTIMOS_28"
  | "ULTIMOS_90"
  | "ULTIMOS_365"
  | "VIDA_TODA"
  | `ANO_${number}`
  | `MES_${number}`
  | "CUSTOM";

type Aba = "overview" | "conteudo";

const catalogBySlug = new Map(BLOG_CATALOG.map((p) => [p.slug, p]));

function formatVariacao(v: number | null | undefined): string | null {
  if (v == null) return null;
  const abs = Math.abs(v).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
  if (v === 0) return "igual ao período anterior";
  if (v > 0) return `${abs}% a mais que o período anterior`;
  return `${abs}% a menos que o período anterior`;
}

function formatDuracaoTop(segundos: number | null | undefined, pct: number | null | undefined): string {
  if (segundos == null || Number.isNaN(segundos)) return "— (—)";
  const total = Math.max(0, Math.round(segundos));
  const m = Math.floor(total / 60);
  const s = total % 60;
  const tempo = `${m}:${String(s).padStart(2, "0")}`;
  if (pct == null || Number.isNaN(pct)) return `${tempo} (—)`;
  return `${tempo} (${pct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%)`;
}

function formatMmSs(segundos: number): string {
  const total = Math.max(0, Math.round(segundos));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatOverviewKpi(metrica: AdminBlogMetricaOverviewTipo, valor: number): string {
  if (metrica === "TEMPO") {
    return valor.toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 0 });
  }
  return Math.round(valor).toLocaleString("pt-BR");
}

function formatConteudoKpi(metrica: AdminBlogMetricaConteudoTipo, valor: number): string {
  if (metrica === "DURACAO_MEDIA") return formatMmSs(valor);
  if (metrica === "SCROLL") {
    return `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
  }
  return Math.round(valor).toLocaleString("pt-BR");
}

function hostnameOrigem(referrer: string): string {
  if (!referrer.trim()) return "Direto";
  try {
    return new URL(referrer).hostname.replace(/^www\./, "") || "Outros";
  } catch {
    return "Outros";
  }
}

/** Agrupa por host, top 5 + Outros, com % do total (estilo YouTube). */
function agruparOrigensBarras(
  itens: Array<{ referrer: string; visitas: number }>,
): Array<{ label: string; visitas: number; percentual: number; outros: boolean }> {
  const porHost = new Map<string, number>();
  for (const item of itens) {
    const key = hostnameOrigem(item.referrer);
    porHost.set(key, (porHost.get(key) ?? 0) + item.visitas);
  }
  const ordenado = [...porHost.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const total = ordenado.reduce((s, [, v]) => s + v, 0);
  if (total === 0) return [];

  const top = ordenado.slice(0, 5);
  const resto = ordenado.slice(5).reduce((s, [, v]) => s + v, 0);
  const rows = top.map(([label, visitas]) => ({
    label,
    visitas,
    percentual: (visitas / total) * 100,
    outros: false,
  }));
  if (resto > 0) {
    rows.push({
      label: "Outros",
      visitas: resto,
      percentual: (resto / total) * 100,
      outros: true,
    });
  }
  return rows;
}

function formatPctOrigem(pct: number): string {
  return `${pct.toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%`;
}

function ChartComLoading({
  loading,
  children,
  className,
}: {
  loading: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative min-h-[260px]", className)}>
      {children}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/55">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" aria-label="Carregando" />
        </div>
      )}
    </div>
  );
}

function eixoZerado(
  periodKey: PeriodKey,
  customRange: DateRange | undefined,
): Array<{ label: string; value: number }> {
  let dias = 28;
  if (periodKey === "ULTIMOS_7") dias = 7;
  else if (periodKey === "ULTIMOS_90") dias = 90;
  else if (periodKey === "ULTIMOS_365" || periodKey.startsWith("ANO_")) dias = 365;
  else if (periodKey.startsWith("MES_")) dias = 31;
  else if (periodKey === "CUSTOM" && customRange?.from && customRange?.to) {
    dias = Math.max(
      1,
      Math.floor((customRange.to.getTime() - customRange.from.getTime()) / 86_400_000) + 1,
    );
  }
  dias = Math.min(dias, 90);
  const fim = customRange?.to && periodKey === "CUSTOM" ? customRange.to : new Date();
  const pontos: Array<{ label: string; value: number }> = [];
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(fim);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    pontos.push({ label: format(d, "yyyy-MM-dd"), value: 0 });
  }
  return pontos;
}

export default function AdminBlogMetricasPage() {
  const agora = new Date();
  const anoAtual = agora.getFullYear();
  const mesAtual = agora.getMonth() + 1;

  const [aba, setAba] = useState<Aba>("overview");
  const [periodKey, setPeriodKey] = useState<PeriodKey>("ULTIMOS_28");
  const [metricaOverview, setMetricaOverview] = useState<AdminBlogMetricaOverviewTipo>("VIEWS");
  const [metricaConteudo, setMetricaConteudo] = useState<AdminBlogMetricaConteudoTipo>("VIEWS");
  const [customOpen, setCustomOpen] = useState(false);
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [customDraft, setCustomDraft] = useState<DateRange | undefined>();

  const periodoParams = useMemo((): AdminBlogMetricasPeriodoParams => {
    if (periodKey === "CUSTOM") {
      if (!customRange?.from || !customRange?.to) return { periodo: "ULTIMOS_28" };
      return {
        periodo: "CUSTOM",
        de: format(customRange.from, "yyyy-MM-dd"),
        ate: format(customRange.to, "yyyy-MM-dd"),
      };
    }
    if (periodKey.startsWith("ANO_")) {
      return { periodo: "ANO", ano: Number(periodKey.replace("ANO_", "")) };
    }
    if (periodKey.startsWith("MES_")) {
      return {
        periodo: "MES",
        mes: Number(periodKey.replace("MES_", "")),
        ano: anoAtual,
      };
    }
    return { periodo: periodKey as AdminBlogMetricaPeriodo };
  }, [periodKey, customRange, anoAtual]);

  const overviewParams = useMemo(
    () => ({ ...periodoParams, metrica: metricaOverview }),
    [periodoParams, metricaOverview],
  );
  const conteudoParams = useMemo(
    () => ({ ...periodoParams, metrica: metricaConteudo }),
    [periodoParams, metricaConteudo],
  );

  const overviewQ = useQuery({
    queryKey: queryKeys.admin.blogMetricasOverview(overviewParams),
    queryFn: () => obterBlogMetricasOverviewAdmin(overviewParams),
    ...CACHE_MEDIUM,
    enabled: aba === "overview",
    placeholderData: keepPreviousData,
  });

  const conteudoQ = useQuery({
    queryKey: queryKeys.admin.blogMetricasConteudo(conteudoParams),
    queryFn: () => obterBlogMetricasConteudoAdmin(conteudoParams),
    ...CACHE_MEDIUM,
    enabled: aba === "conteudo",
    placeholderData: keepPreviousData,
  });

  const topQ = useQuery({
    queryKey: queryKeys.admin.blogMetricasTopConteudo(periodoParams),
    queryFn: () => obterBlogMetricasTopConteudoAdmin(periodoParams),
    ...CACHE_MEDIUM,
    enabled: aba === "overview",
    placeholderData: keepPreviousData,
  });

  const origensQ = useQuery({
    queryKey: queryKeys.admin.blogMetricasOrigens(periodoParams),
    queryFn: () => obterBlogMetricasOrigensAdmin(periodoParams),
    ...CACHE_MEDIUM,
    enabled: aba === "conteudo",
    placeholderData: keepPreviousData,
  });

  const monthName = (m: number) =>
    (
      [
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
      ] as const
    )[m - 1] ?? `mês ${m}`;

  const mesesOpcoes = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < 3; i++) {
      let m = mesAtual - i;
      if (m <= 0) m += 12;
      out.push(m);
    }
    return out;
  }, [mesAtual]);

  const overviewCards: Array<{
    key: AdminBlogMetricaOverviewTipo;
    label: string;
    valor: number;
    variacao: number | null;
  }> = [
    {
      key: "VIEWS",
      label: "Views",
      valor: overviewQ.data?.views.valor ?? 0,
      variacao: overviewQ.data?.views.variacaoPercentual ?? null,
    },
    {
      key: "TEMPO",
      label: "Tempo de leitura (h)",
      valor: overviewQ.data?.tempoLeituraHoras.valor ?? 0,
      variacao: overviewQ.data?.tempoLeituraHoras.variacaoPercentual ?? null,
    },
    {
      key: "VISITANTES",
      label: "Visitantes únicos",
      valor: overviewQ.data?.visitantesUnicos.valor ?? 0,
      variacao: overviewQ.data?.visitantesUnicos.variacaoPercentual ?? null,
    },
  ];

  const conteudoCards: Array<{
    key: AdminBlogMetricaConteudoTipo;
    label: string;
    valor: number;
    variacao: number | null;
  }> = [
    {
      key: "VIEWS",
      label: "Views",
      valor: conteudoQ.data?.views.valor ?? 0,
      variacao: conteudoQ.data?.views.variacaoPercentual ?? null,
    },
    {
      key: "DURACAO_MEDIA",
      label: "Duração média",
      valor: conteudoQ.data?.duracaoMediaSegundos.valor ?? 0,
      variacao: conteudoQ.data?.duracaoMediaSegundos.variacaoPercentual ?? null,
    },
    {
      key: "SCROLL",
      label: "Scroll da página",
      valor: conteudoQ.data?.scrollMedioPercentual.valor ?? 0,
      variacao: conteudoQ.data?.scrollMedioPercentual.variacaoPercentual ?? null,
    },
    {
      key: "CURTIDAS",
      label: "Curtidas",
      valor: conteudoQ.data?.curtidas.valor ?? 0,
      variacao: conteudoQ.data?.curtidas.variacaoPercentual ?? null,
    },
    {
      key: "COMENTARIOS",
      label: "Comentários",
      valor: conteudoQ.data?.comentarios.valor ?? 0,
      variacao: conteudoQ.data?.comentarios.variacaoPercentual ?? null,
    },
  ];

  const overviewChart = useMemo(() => {
    if (!overviewQ.isPlaceholderData && overviewQ.data?.serie?.length) {
      return overviewQ.data.serie.map((p) => ({ label: p.data, value: p.valor }));
    }
    return eixoZerado(periodKey, customRange);
  }, [overviewQ.data, overviewQ.isPlaceholderData, periodKey, customRange]);

  const conteudoChart = useMemo(() => {
    if (!conteudoQ.isPlaceholderData && conteudoQ.data?.serie?.length) {
      return conteudoQ.data.serie.map((p) => ({ label: p.data, value: p.valor }));
    }
    return eixoZerado(periodKey, customRange);
  }, [conteudoQ.data, conteudoQ.isPlaceholderData, periodKey, customRange]);

  const topConteudo = topQ.data?.itens ?? [];
  const origensBarras = useMemo(
    () => agruparOrigensBarras(origensQ.data?.itens ?? []),
    [origensQ.data?.itens],
  );
  const maxPctOrigem = origensBarras[0]?.percentual ?? 100;

  return (
    <div className="space-y-0">
      <Tabs value={aba} onValueChange={(v) => setAba(v as Aba)} className="w-full">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-0">
          <TabsList className="h-auto gap-0 rounded-none bg-transparent p-0">
            <TabsTrigger
              value="overview"
              className="rounded-none border-b-2 border-transparent bg-transparent px-3 pb-3 pt-1 text-sm font-medium text-muted-foreground shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="conteudo"
              className="rounded-none border-b-2 border-transparent bg-transparent px-3 pb-3 pt-1 text-sm font-medium text-muted-foreground shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              Content
            </TabsTrigger>
          </TabsList>
          <div className="flex flex-wrap items-center justify-end gap-2 pb-2">
            <Select
              value={periodKey}
              onValueChange={(v) => {
                const next = v as PeriodKey;
                setPeriodKey(next);
                if (next === "CUSTOM") {
                  setCustomDraft(customRange);
                  window.setTimeout(() => setCustomOpen(true), 0);
                } else {
                  setCustomOpen(false);
                }
              }}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ULTIMOS_7">Últimos 7 dias</SelectItem>
                <SelectItem value="ULTIMOS_28">Últimos 28 dias</SelectItem>
                <SelectItem value="ULTIMOS_90">Últimos 90 dias</SelectItem>
                <SelectItem value="ULTIMOS_365">Últimos 365 dias</SelectItem>
                <SelectItem value="VIDA_TODA">Todo o período</SelectItem>
                <SelectItem value={`ANO_${anoAtual}`}>{anoAtual}</SelectItem>
                {anoAtual > 2025 && (
                  <SelectItem value={`ANO_${anoAtual - 1}`}>{anoAtual - 1}</SelectItem>
                )}
                {mesesOpcoes.map((m) => (
                  <SelectItem key={m} value={`MES_${m}`}>
                    {monthName(m)}
                  </SelectItem>
                ))}
                <SelectItem value="CUSTOM">Personalizado</SelectItem>
              </SelectContent>
            </Select>

            <Dialog
              open={customOpen}
              onOpenChange={(open) => {
                setCustomOpen(open);
                if (!open && (!customRange?.from || !customRange?.to)) {
                  setPeriodKey("ULTIMOS_28");
                }
              }}
            >
              <DialogContent className="w-auto max-w-fit sm:max-w-fit">
                <DialogHeader>
                  <DialogTitle>Período personalizado</DialogTitle>
                </DialogHeader>
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
                    {customDraft?.from && customDraft?.to
                      ? `${Math.max(
                          1,
                          Math.floor(
                            (customDraft.to.getTime() - customDraft.from.getTime()) / 86_400_000,
                          ) + 1,
                        )} dias selecionados`
                      : "Selecione o início e o fim"}
                  </p>
                  <CalendarComponent
                    mode="range"
                    selected={customDraft}
                    onSelect={setCustomDraft}
                    numberOfMonths={1}
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCustomDraft(customRange);
                      setCustomOpen(false);
                      if (!customRange?.from || !customRange?.to) setPeriodKey("ULTIMOS_28");
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
                    Aplicar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TabsContent value="overview" className="mt-10 space-y-8 focus-visible:ring-0">
          <p className="text-center text-lg font-bold text-foreground sm:text-xl">
            {!overviewQ.data && overviewQ.isPending
              ? "Carregando…"
              : !overviewQ.data && overviewQ.isError
                ? "Não foi possível carregar as métricas."
                : overviewQ.data?.headline}
          </p>

          <Card>
            <CardContent className="space-y-8 pt-4">
              <div className="grid gap-0 sm:grid-cols-3">
                {overviewCards.map((card, idx) => {
                  const ativo = metricaOverview === card.key;
                  const textoVar = ativo ? formatVariacao(card.variacao) : null;
                  return (
                    <button
                      key={card.key}
                      type="button"
                      onClick={() => setMetricaOverview(card.key)}
                      className={cn(
                        "px-4 py-3 text-center transition-colors",
                        idx > 0 && "sm:border-l sm:border-border",
                        ativo ? "bg-muted/60" : "hover:bg-muted/30",
                      )}
                    >
                      <div className="text-xs font-medium text-muted-foreground">{card.label}</div>
                      <div className="mt-1 flex items-center justify-center gap-1.5">
                        <span className="text-2xl font-semibold tabular-nums">
                          {formatOverviewKpi(card.key, card.valor)}
                        </span>
                        {ativo && card.variacao != null && card.variacao !== 0 && (
                          card.variacao > 0 ? (
                            <ArrowUp className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <ArrowDown className="h-4 w-4 text-destructive" />
                          )
                        )}
                      </div>
                      {textoVar && (
                        <p className="mt-1 text-xs text-muted-foreground">{textoVar}</p>
                      )}
                    </button>
                  );
                })}
              </div>

              {overviewQ.isError ? null : (
                <ChartComLoading loading={overviewQ.isFetching}>
                  <LimeLineChart
                    points={overviewChart}
                    yAxisWidth={36}
                    yMinFloor={metricaOverview === "TEMPO" ? 0.1 : 1}
                    allowDecimals={metricaOverview === "TEMPO"}
                    yTickFormatter={(v) =>
                      metricaOverview === "TEMPO"
                        ? v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })
                        : String(Math.round(v))
                    }
                    tooltipFormat={(v) =>
                      metricaOverview === "TEMPO"
                        ? `${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} h`
                        : String(Math.round(v))
                    }
                    xTickFormatter={(v) => (v.length >= 10 ? `${v.slice(8, 10)}/${v.slice(5, 7)}` : v)}
                  />
                </ChartComLoading>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Seu top conteúdo neste período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="pb-2 pr-3 text-left font-medium">Conteúdo</th>
                      <th className="pb-2 px-3 text-right font-medium whitespace-nowrap">
                        Duração média
                      </th>
                      <th className="pb-2 pl-3 text-right font-medium">Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!topQ.isLoading &&
                      !topQ.isError &&
                      topConteudo.map((item, i) => {
                        const meta = catalogBySlug.get(item.slug);
                        return (
                          <tr key={item.slug} className="border-b border-border/60 last:border-0">
                            <td className="py-3 pr-3">
                              <div className="flex items-center gap-3">
                                <span className="w-5 shrink-0 text-muted-foreground tabular-nums">
                                  {i + 1}
                                </span>
                                <img
                                  src={blogCapaPath(item.slug)}
                                  alt=""
                                  className="h-10 w-[72px] shrink-0 rounded object-cover bg-muted"
                                  loading="lazy"
                                />
                                <div className="min-w-0">
                                  <a
                                    href={blogPostPath(item.slug)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="line-clamp-2 font-medium text-foreground hover:underline"
                                  >
                                    {meta?.title ?? item.slug}
                                  </a>
                                  <p className="text-xs text-muted-foreground">
                                    {meta?.publishedAt ? formatBlogDate(meta.publishedAt) : "—"}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right tabular-nums whitespace-nowrap">
                              {formatDuracaoTop(item.tempoMedioSegundos, item.percentualMedioLido)}
                            </td>
                            <td className="py-3 pl-3 text-right tabular-nums font-medium">
                              {item.views.toLocaleString("pt-BR")}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
                {!topQ.isLoading && !topQ.isError && topConteudo.length === 0 && (
                  <p className="pt-3 text-sm text-muted-foreground">
                    Nenhum post com views no período.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conteudo" className="mt-10 space-y-8 focus-visible:ring-0">
          <p className="text-center text-lg font-bold text-foreground sm:text-xl">
            Seu conteúdo neste período
          </p>

          <Card>
            <CardContent className="space-y-8 pt-4">
              <div className="grid gap-0 sm:grid-cols-5">
                {conteudoCards.map((card, idx) => {
                  const ativo = metricaConteudo === card.key;
                  const textoVar = ativo ? formatVariacao(card.variacao) : null;
                  return (
                    <button
                      key={card.key}
                      type="button"
                      onClick={() => setMetricaConteudo(card.key)}
                      className={cn(
                        "px-3 py-3 text-center transition-colors",
                        idx > 0 && "sm:border-l sm:border-border",
                        ativo ? "bg-background shadow-sm" : "bg-muted/40 hover:bg-muted/60",
                      )}
                    >
                      <div className="text-xs font-medium text-muted-foreground">{card.label}</div>
                      <div className="mt-1 flex items-center justify-center gap-1.5">
                        <span className="text-2xl font-semibold tabular-nums">
                          {formatConteudoKpi(card.key, card.valor)}
                        </span>
                        {ativo && card.variacao != null && card.variacao !== 0 && (
                          card.variacao > 0 ? (
                            <ArrowUp className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <ArrowDown className="h-4 w-4 text-destructive" />
                          )
                        )}
                      </div>
                      {textoVar && (
                        <p className="mt-1 text-xs text-muted-foreground">{textoVar}</p>
                      )}
                    </button>
                  );
                })}
              </div>

              {conteudoQ.isError ? null : (
                <ChartComLoading loading={conteudoQ.isFetching}>
                  <LimeLineChart
                    points={conteudoChart}
                    yAxisWidth={40}
                    yMinFloor={
                      metricaConteudo === "DURACAO_MEDIA" || metricaConteudo === "SCROLL" ? 0.1 : 1
                    }
                    allowDecimals={
                      metricaConteudo === "DURACAO_MEDIA" || metricaConteudo === "SCROLL"
                    }
                    yTickFormatter={(v) => {
                      if (metricaConteudo === "DURACAO_MEDIA") return formatMmSs(v);
                      if (metricaConteudo === "SCROLL") {
                        return `${v.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%`;
                      }
                      return String(Math.round(v));
                    }}
                    tooltipFormat={(v) => {
                      if (metricaConteudo === "DURACAO_MEDIA") return formatMmSs(v);
                      if (metricaConteudo === "SCROLL") {
                        return `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
                      }
                      return String(Math.round(v));
                    }}
                    xTickFormatter={(v) => (v.length >= 10 ? `${v.slice(8, 10)}/${v.slice(5, 7)}` : v)}
                  />
                </ChartComLoading>
              )}
            </CardContent>
          </Card>

          <Card className="w-full md:w-1/2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Como os leitores encontram o blog</CardTitle>
              <p className="text-sm text-muted-foreground">
                Views
                {origensQ.data?.periodoLabel
                  ? ` · ${origensQ.data.periodoLabel.replace(/^nos?\s+/i, "")}`
                  : ""}
              </p>
            </CardHeader>
            <CardContent>
              <ChartComLoading loading={origensQ.isFetching} className="min-h-[120px]">
                {origensBarras.length > 0 ? (
                  <ul className="space-y-3">
                    {origensBarras.map((row) => (
                      <li key={row.label} className="grid grid-cols-[7.5rem_1fr_3.25rem] items-center gap-3 text-sm">
                        <span className="truncate text-foreground" title={row.label}>
                          {row.label}
                        </span>
                        <div className="h-2.5 overflow-hidden rounded-sm bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-sm",
                              row.outros ? "bg-muted-foreground/40" : "bg-[hsl(78_95%_45%)]",
                            )}
                            style={{ width: `${Math.max(2, (row.percentual / maxPctOrigem) * 100)}%` }}
                          />
                        </div>
                        <span className="text-right tabular-nums text-muted-foreground">
                          {formatPctOrigem(row.percentual)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : origensQ.isFetching ? (
                  <div className="min-h-[120px]" />
                ) : (
                  !origensQ.isError && (
                    <p className="text-sm text-muted-foreground">Nenhuma visita no período.</p>
                  )
                )}
              </ChartComLoading>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
