import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldWithExpected } from "@/components/ui/field-with-expected";
import { Eye, EyeOff, LogIn, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useValidation } from "@/hooks/useValidation";
import { maskCpfInput, maskCnpjInput, maskUsernameInput, maskEmailInput, maskDddInput, maskNumeroTelefoneInput } from "@/lib/format";
import {
  validateCredencialByTipo,
  validateSenha,
  getFieldExpected,
  validateCodigoPais,
  validateDdd,
  validateNumeroTelefone,
} from "@/lib/validations";
import type { TipoCredencial } from "@/types/auth";

type PaisDdd = { codigo: string; fone: string; nome: string };

function foneSemZerosEsquerda(fone: string): string {
  return (fone || "").replace(/^0+/, "") || "0";
}

export default function AdminLoginPage() {
  const { login, isLoading } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [valor, setValor] = useState("");
  const [tipoCredencial, setTipoCredencial] = useState<TipoCredencial>("EMAIL");
  const [codigoPais, setCodigoPais] = useState("55");
  const [ddd, setDdd] = useState("");
  const [telefoneNumero, setTelefoneNumero] = useState("");
  const [paises, setPaises] = useState<PaisDdd[]>([]);
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { getError, getTouched, handleBlur, handleChange, validateAll, clearError } = useValidation();

  const validateValor = (v: string) => validateCredencialByTipo(v, tipoCredencial, true);

  useEffect(() => {
    fetch("/pais-ddd.json")
      .then((res) => res.json())
      .then((data: PaisDdd[]) => {
        const sorted = [...(data || [])].sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
        setPaises(sorted);
      })
      .catch(() => setPaises([]));
  }, []);

  useEffect(() => {
    if (searchParams.get("unauthorized") === "1") {
      toast({
        variant: "destructive",
        title: "Não autorizado",
        description: "Seu usuário não tem permissão para acessar esta área.",
      });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, toast]);

  useEffect(() => {
    if (tipoCredencial === "CPF") setValor((v) => (v ? maskCpfInput(v) : v));
    if (tipoCredencial === "CNPJ") setValor((v) => (v ? maskCnpjInput(v) : v));
    if (tipoCredencial === "USERNAME") setValor((v) => (v ? maskUsernameInput(v) : v));
    if (tipoCredencial === "EMAIL") setValor((v) => (v ? maskEmailInput(v) : v));
  }, [tipoCredencial]);

  const telefoneFormularioValido =
    !validateCodigoPais(codigoPais.replace(/\D/g, "") || null, true) &&
    !validateDdd(ddd, true) &&
    !validateNumeroTelefone(telefoneNumero, true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok =
      tipoCredencial === "TELEFONE"
        ? validateAll([
            ["codigoPais", codigoPais.replace(/\D/g, ""), (v) => validateCodigoPais(v || null, true)],
            ["ddd", ddd, (v) => validateDdd(v, true)],
            ["telefone", telefoneNumero, (v) => validateNumeroTelefone(v, true)],
            ["senha", senha, (v) => validateSenha(v, true)],
          ])
        : validateAll([
            ["valor", valor, validateValor],
            ["senha", senha, (v) => validateSenha(v, true)],
          ]);
    if (!ok) return;

    let valorEnvio: string;
    if (tipoCredencial === "TELEFONE") {
      valorEnvio =
        foneSemZerosEsquerda(codigoPais.replace(/\D/g, "")) +
        ddd.replace(/\D/g, "") +
        telefoneNumero.replace(/\D/g, "");
    } else if (tipoCredencial === "CPF") {
      valorEnvio = valor.replace(/\D/g, "");
    } else if (tipoCredencial === "CNPJ") {
      valorEnvio = valor.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    } else {
      valorEnvio = valor;
    }

    try {
      await login({ valor: valorEnvio, tipoCredencial, senha });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { mensagem?: string } } };
      toast({
        variant: "destructive",
        title: "Erro ao entrar",
        description: err.response?.data?.mensagem || "Credenciais inválidas. Tente novamente.",
      });
    }
  };

  const placeholders: Record<TipoCredencial, string> = {
    EMAIL: "seu@email.com",
    USERNAME: "seu.usuario",
    CPF: "000.000.000-00",
    CNPJ: "00.000.000/0000-00",
    TELEFONE: "(00) 00000-0000",
  };

  const credencialPreenchida =
    tipoCredencial === "TELEFONE"
      ? telefoneFormularioValido && codigoPais.replace(/\D/g, "").length > 0
      : valor.trim().length > 0 && !validateValor(valor);

  const submitDisabled =
    isLoading || !credencialPreenchida || !senha || !!validateSenha(senha, true);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <ShieldCheck className="h-10 w-10 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Admin Console</h1>
          <p className="text-sm text-muted-foreground">Acesso exclusivo para administradores SegPonto</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl border bg-card">
              <LogIn className="h-6 w-6" />
            </div>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>Use suas credenciais de administrador</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tipoCredencial" required>
                  Tipo de credencial
                </Label>
                <Select
                  value={tipoCredencial}
                  onValueChange={(v) => {
                    setTipoCredencial(v as TipoCredencial);
                    setValor("");
                    setDdd("");
                    setTelefoneNumero("");
                    clearError("valor");
                    clearError("ddd");
                    clearError("telefone");
                  }}
                >
                  <SelectTrigger id="tipoCredencial">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMAIL">E-mail</SelectItem>
                    <SelectItem value="USERNAME">Usuário</SelectItem>
                    <SelectItem value="TELEFONE">Telefone</SelectItem>
                    <SelectItem value="CPF">CPF</SelectItem>
                    <SelectItem value="CNPJ">CNPJ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {tipoCredencial === "TELEFONE" ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-2 sm:col-span-1">
                    <Label required>País</Label>
                    <Select value={codigoPais} onValueChange={setCodigoPais}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {paises.map((p) => (
                          <SelectItem key={`${p.codigo}-${p.fone}`} value={foneSemZerosEsquerda(p.fone)}>
                            {p.nome} (+{foneSemZerosEsquerda(p.fone)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <FieldWithExpected
                    label="DDD"
                    required
                    error={getTouched("ddd") ? getError("ddd") : undefined}
                    expected={getFieldExpected("ddd")}
                    className="sm:col-span-1"
                  >
                    <Input
                      value={ddd}
                      onChange={(e) => {
                        const v = maskDddInput(e.target.value);
                        setDdd(v);
                        handleChange("ddd", v, (x) => validateDdd(x, true));
                      }}
                      onBlur={() => handleBlur("ddd", ddd, (x) => validateDdd(x, true))}
                      placeholder="11"
                    />
                  </FieldWithExpected>
                  <FieldWithExpected
                    label="Número"
                    required
                    error={getTouched("telefone") ? getError("telefone") : undefined}
                    expected={getFieldExpected("telefone")}
                    className="sm:col-span-1"
                  >
                    <Input
                      value={telefoneNumero}
                      onChange={(e) => {
                        const v = maskNumeroTelefoneInput(e.target.value);
                        setTelefoneNumero(v);
                        handleChange("telefone", v, (x) => validateNumeroTelefone(x, true));
                      }}
                      onBlur={() => handleBlur("telefone", telefoneNumero, (x) => validateNumeroTelefone(x, true))}
                      placeholder="99999-9999"
                    />
                  </FieldWithExpected>
                </div>
              ) : (
                <FieldWithExpected
                  label="Credencial"
                  required
                  error={getTouched("valor") ? getError("valor") : undefined}
                  expected={getFieldExpected(tipoCredencial === "EMAIL" ? "email" : tipoCredencial.toLowerCase())}
                >
                  <Input
                    value={valor}
                    onChange={(e) => {
                      let v = e.target.value;
                      if (tipoCredencial === "CPF") v = maskCpfInput(v);
                      if (tipoCredencial === "CNPJ") v = maskCnpjInput(v);
                      if (tipoCredencial === "USERNAME") v = maskUsernameInput(v);
                      if (tipoCredencial === "EMAIL") v = maskEmailInput(v);
                      setValor(v);
                      handleChange("valor", v, validateValor);
                    }}
                    onBlur={() => handleBlur("valor", valor, validateValor)}
                    placeholder={placeholders[tipoCredencial]}
                    autoComplete="username"
                  />
                </FieldWithExpected>
              )}

              <FieldWithExpected
                label="Senha"
                required
                error={getTouched("senha") ? getError("senha") : undefined}
                expected={getFieldExpected("senha")}
              >
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={senha}
                    onChange={(e) => {
                      setSenha(e.target.value);
                      handleChange("senha", e.target.value, (v) => validateSenha(v, true));
                    }}
                    onBlur={() => handleBlur("senha", senha, (v) => validateSenha(v, true))}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FieldWithExpected>

              <Button type="submit" className="w-full" disabled={submitDisabled}>
                {isLoading ? "Entrando…" : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
