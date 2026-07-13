import React, { useState } from "react";
import { motion } from "motion/react";
import { Loader2, User, Phone, FileText, AlertCircle, ShieldCheck } from "lucide-react";
import { formatarCNPJ, formatarWhatsApp, validarCNPJ, validarWhatsApp } from "../lib/validation";
import { FormFields } from "../types";

interface FormularioScreenProps {
  onSubmit: (dados: FormFields) => void;
  isLoading: boolean;
  errorMessage: string | null;
}

export default function FormularioScreen({ onSubmit, isLoading, errorMessage }: FormularioScreenProps) {
  const [nome, setNome] = useState("");
  const [celular, setCelular] = useState("");
  const [cnpj, setCnpj] = useState("");

  const [errors, setErrors] = useState<{ nome?: string; celular?: string; cnpj?: string }>({});

  const handleCelularChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCelular(formatarWhatsApp(e.target.value));
    if (errors.celular) setErrors((prev) => ({ ...prev, celular: undefined }));
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCnpj(formatarCNPJ(e.target.value));
    if (errors.cnpj) setErrors((prev) => ({ ...prev, cnpj: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const newErrors: typeof errors = {};

    if (!nome.trim()) {
      newErrors.nome = "Nome completo é obrigatório";
    } else if (nome.trim().split(" ").length < 2) {
      newErrors.nome = "Insira seu nome e sobrenome completo";
    }

    if (!celular) {
      newErrors.celular = "Celular é obrigatório";
    } else if (!validarWhatsApp(celular)) {
      newErrors.celular = "Celular inválido. Ex: (11) 98765-4321";
    }

    if (!cnpj) {
      newErrors.cnpj = "CNPJ é obrigatório";
    } else if (!validarCNPJ(cnpj)) {
      newErrors.cnpj = "CNPJ inválido ou incorreto. Verifique os números.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({ nome, celular, cnpj });
  };

  return (
    <div className="w-full min-h-screen flex flex-col justify-center items-center py-12 px-4 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#FFFAF0]/90 border border-black/5 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-2xl"
      >
        <div className="text-center mb-6">
          <h2 className="font-display text-2xl md:text-3xl uppercase leading-tight font-bold tracking-tight text-[#1A1208]">
            Preencha pra girar
          </h2>
          <p className="font-sans text-sm text-[#6B6048] mt-2 leading-relaxed">
            Cada pessoa tem direito a um giro só.
          </p>
        </div>

        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg flex items-center gap-2 text-xs mb-4 font-sans">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block font-sans text-xs font-bold text-[#4A4030] uppercase tracking-widest flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Nome completo
            </label>
            <input
              type="text"
              required
              disabled={isLoading}
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                if (errors.nome) setErrors((prev) => ({ ...prev, nome: undefined }));
              }}
              placeholder="Seu nome completo"
              className="w-full bg-[#FFF6E6] border-2 border-black/10 focus:border-[#FF6801] text-[#1A1208] px-4 py-3 rounded-lg outline-none font-sans text-sm md:text-base transition-colors focus:ring-1 focus:ring-[#FF6801]"
            />
            {errors.nome && <p className="text-xs text-rose-400 font-sans font-medium">{errors.nome}</p>}
          </div>

          <div className="space-y-1">
            <label className="block font-sans text-xs font-bold text-[#4A4030] uppercase tracking-widest flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              Celular
            </label>
            <input
              type="tel"
              required
              disabled={isLoading}
              value={celular}
              onChange={handleCelularChange}
              placeholder="(00) 00000-0000"
              className="w-full bg-[#FFF6E6] border-2 border-black/10 focus:border-[#FF6801] text-[#1A1208] px-4 py-3 rounded-lg outline-none font-sans text-sm md:text-base transition-colors focus:ring-1 focus:ring-[#FF6801]"
            />
            {errors.celular && <p className="text-xs text-rose-400 font-sans font-medium">{errors.celular}</p>}
          </div>

          <div className="space-y-1">
            <label className="block font-sans text-xs font-bold text-[#4A4030] uppercase tracking-widest flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              CNPJ
            </label>
            <input
              type="text"
              required
              disabled={isLoading}
              value={cnpj}
              onChange={handleCnpjChange}
              placeholder="00.000.000/0000-00"
              className="w-full bg-[#FFF6E6] border-2 border-black/10 focus:border-[#FF6801] text-[#1A1208] px-4 py-3 rounded-lg outline-none font-sans text-sm md:text-base transition-colors focus:ring-1 focus:ring-[#FF6801]"
            />
            {errors.cnpj && <p className="text-xs text-rose-400 font-sans font-medium">{errors.cnpj}</p>}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#FF6801] hover:bg-[#e05c01] disabled:bg-gray-700 text-white font-display text-base md:text-lg uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer btn-glow active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span>GIRANDO...</span>
                </>
              ) : (
                <span>GIRAR A ROLETA</span>
              )}
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-[10px] text-[#857a5e] pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <p className="font-sans leading-tight">
              Seus dados são usados apenas para contato comercial da Feramaq. Sem spam.
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
