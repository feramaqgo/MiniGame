import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, MessageSquare } from "lucide-react";
import { sfx } from "../lib/sfx";

interface StoryScreenProps {
  lines: string[];
  avatarSrc?: string;
  onComplete: () => void;
}

export function StoryScreen({ lines, avatarSrc = "/rinoceronte-goleiro.png", onComplete }: StoryScreenProps) {
  const [currentLine, setCurrentLine] = useState(0);

  const handleNext = () => {
    sfx.click();
    if (currentLine < lines.length - 1) {
      setCurrentLine(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md card-arcade rounded-3xl p-6 md:p-8 pt-8 text-center space-y-6 relative overflow-hidden bg-[#FFFAF0] shadow-2xl border-4 border-[#FF6801]"
    >
      <div className="absolute top-0 inset-x-0 h-3 bg-[#FF6801]" />
      
      <div className="flex flex-col items-center gap-6 mt-4">
        <motion.div 
          initial={{ y: 10 }}
          animate={{ y: 0 }}
          transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.5 }}
          className="relative w-36 h-36 md:w-48 md:h-48"
        >
          <img 
            src={avatarSrc} 
            alt="Mascote Feramaq" 
            className="w-full h-full object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.25)]"
          />
        </motion.div>

        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-md border-2 border-black/10 relative w-full text-left">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[14px] border-b-white"></div>
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-b-[16px] border-b-black/10 -z-10"></div>
          
          <div className="flex items-center gap-2 text-[#FF6801] mb-2">
            <MessageSquare className="w-4 h-4" />
            <span className="font-display font-bold uppercase tracking-widest text-xs">O Rino</span>
          </div>
          
          <AnimatePresence mode="wait">
            <motion.p
              key={currentLine}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
              className="font-sans text-base md:text-lg text-[#23201B] font-medium leading-relaxed min-h-[4.5rem]"
            >
              {lines[currentLine]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <div className="pt-4">
        <button
          onClick={handleNext}
          className="btn-laranja w-full font-display text-lg md:text-xl uppercase tracking-widest px-8 py-4 rounded-xl flex items-center justify-center gap-3 cursor-pointer shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <span>{currentLine < lines.length - 1 ? "Próximo" : "Começar"}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      <div className="flex justify-center gap-1.5 pt-2">
        {lines.map((_, idx) => (
          <div 
            key={idx} 
            className={`h-2 rounded-full transition-all duration-300 ${idx === currentLine ? 'w-6 bg-[#FF6801]' : 'w-2 bg-black/10'}`} 
          />
        ))}
      </div>
    </motion.div>
  );
}
