import { motion } from "motion/react";
import { ArrowRight, PackageX } from "lucide-react";

interface EsgotadoScreenProps {
  /** Fluxo tablet: volta pro início (tela do QR) pro próximo visitante. */
  onProximo?: () => void;
}

export default function EsgotadoScreen({ onProximo }: EsgotadoScreenProps) {
  return (
    <div className="w-full min-h-screen flex flex-col justify-center items-center py-12 px-4 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#FFFAF0]/90 border border-black/5 backdrop-blur-md rounded-3xl p-8 shadow-2xl text-center space-y-4"
      >
        <PackageX className="w-12 h-12 text-[#FF6801] mx-auto" />
        <h2 className="font-display text-2xl md:text-3xl uppercase tracking-tight font-bold text-[#1A1208]">
          Os brindes acabaram
        </h2>
        <p className="font-sans text-sm text-[#6B6048] leading-relaxed">
          Obrigado pelo interesse! Todos os brindes desta promoção já foram distribuídos. Fica de
          olho nas próximas ações da Feramaq.
        </p>
        {onProximo && (
          <button
            onClick={onProximo}
            className="w-full bg-[#1A1208] hover:bg-black text-[#F5C518] font-display text-sm uppercase tracking-widest px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>Próximo visitante</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </motion.div>
    </div>
  );
}
