import { useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { saveTabletSenha } from "../../shared/lib/tablet";
import { sfx } from "../../shared/lib/sfx";

interface SenhaScreenProps {
  onDesbloqueado: () => void;
}

/** Desbloqueio único do tablet pela equipe do estande (senha do admin).
 * Depois de validada, a senha fica no aparelho e não é pedida de novo. */
export default function SenhaScreen({ onDesbloqueado }: SenhaScreenProps) {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [validando, setValidando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Teclados de tablet adoram colar espaço no fim ou capitalizar — a senha
    // é comparada exata no servidor, então limpamos antes de enviar.
    const senhaLimpa = senha.trim();
    if (!senhaLimpa || validando) return;

    sfx.click();
    setValidando(true);
    setErro(null);

    try {
      const response = await fetch("/api/tablet-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha: senhaLimpa }),
      });

      if (!response.ok) {
        sfx.erro();
        setErro("Senha incorreta. Ela é toda minúscula, sem espaços.");
        return;
      }

      saveTabletSenha(senhaLimpa);
      sfx.vitoria();
      onDesbloqueado();
    } catch {
      sfx.erro();
      setErro("Sem conexão. Confira a internet do tablet.");
    } finally {
      setValidando(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4">
      <div className="max-w-md w-full card-arcade rounded-3xl p-8 pt-9 text-center space-y-6 relative overflow-hidden">
        <div className="faixa-perigo absolute top-0 inset-x-0 h-2.5" />

        <div className="w-16 h-16 rounded-2xl bg-[#FF6801]/12 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8 text-[#FF6801]" />
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-2xl uppercase tracking-tight font-bold text-[#1A1208]">
            Tablet do estande
          </h1>
          <p className="font-sans text-sm text-[#6B6048]">
            Área da equipe Feramaq. Digite a senha pra ativar este tablet.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={senha}
            onChange={(e) => {
              setSenha(e.target.value);
              if (erro) setErro(null);
            }}
            placeholder="Senha da equipe"
            autoFocus
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="off"
            className="w-full bg-white border-2 border-black/10 focus:border-[#FF6801] text-[#1A1208] px-4 py-3 rounded-lg outline-none font-sans text-base text-center transition-colors focus:ring-1 focus:ring-[#FF6801]"
          />
          {erro && <p className="text-xs text-rose-500 font-sans font-medium">{erro}</p>}

          <button
            type="submit"
            disabled={validando || !senha}
            className="w-full bg-[#FF6801] hover:bg-[#e05c01] disabled:opacity-50 text-white font-display text-lg uppercase tracking-widest px-8 py-4 rounded-xl flex items-center justify-center gap-3 transition-all cursor-pointer btn-glow"
          >
            <Unlock className="w-5 h-5" />
            <span>{validando ? "Validando..." : "Ativar tablet"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
