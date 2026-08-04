import { useEffect, useState } from "react";
import { Download, MonitorSmartphone } from "lucide-react";
import { instalarApp, onInstalavel, rodandoInstalado } from "../lib/pwa";
import { sfx } from "../lib/sfx";

interface BotaoInstalarProps {
  /** "destaque" = botão cheio (tela de setup); "discreto" = link pequeno. */
  variante?: "destaque" | "discreto";
  className?: string;
}

/**
 * Convite pra instalar o arcade como aplicativo. Só aparece quando o
 * navegador confirma que dá pra instalar — e some depois de instalado.
 */
export default function BotaoInstalar({ variante = "destaque", className = "" }: BotaoInstalarProps) {
  const [disponivel, setDisponivel] = useState(false);
  const [instalado, setInstalado] = useState(() => rodandoInstalado());

  useEffect(() => onInstalavel(setDisponivel), []);

  if (instalado || !disponivel) return null;

  const clicar = async () => {
    sfx.click();
    const aceitou = await instalarApp();
    if (aceitou) setInstalado(true);
  };

  if (variante === "discreto") {
    return (
      <button
        onClick={clicar}
        className={`inline-flex items-center gap-2 font-sans text-xs uppercase tracking-widest text-[#857a5e] hover:text-[#FF6801] transition-colors cursor-pointer px-3 py-2 ${className}`}
      >
        <Download className="w-3.5 h-3.5" />
        Instalar aplicativo
      </button>
    );
  }

  return (
    <button
      onClick={clicar}
      className={`w-full border-2 border-[#FF6801]/40 bg-[#FF6801]/8 hover:bg-[#FF6801]/15 text-[#C24E00] font-display text-sm uppercase tracking-widest px-6 py-3.5 rounded-xl flex items-center justify-center gap-2.5 transition-colors cursor-pointer ${className}`}
    >
      <MonitorSmartphone className="w-5 h-5" />
      <span>Instalar aplicativo neste tablet</span>
    </button>
  );
}
