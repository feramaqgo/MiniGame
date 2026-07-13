import { motion } from "motion/react";
import { PackageX } from "lucide-react";

export default function EsgotadoScreen() {
  return (
    <div className="w-full min-h-screen flex flex-col justify-center items-center py-12 px-4 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#1A1410]/90 border border-[#F5C518]/20 backdrop-blur-md rounded-3xl p-8 shadow-2xl text-center space-y-4"
      >
        <PackageX className="w-12 h-12 text-[#FF6801] mx-auto" />
        <h2 className="font-display text-2xl md:text-3xl uppercase tracking-tight font-bold text-[#FFF6E6]">
          Os brindes acabaram
        </h2>
        <p className="font-sans text-sm text-[#B8A98A] leading-relaxed">
          Obrigado pelo interesse! Todos os brindes desta promoção já foram distribuídos. Fica de
          olho nas próximas ações da Feramaq.
        </p>
      </motion.div>
    </div>
  );
}
