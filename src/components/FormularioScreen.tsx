/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { Loader2, ShieldCheck, User, Phone, Building, FileText, AlertCircle, Sparkles } from "lucide-react";
import { formatarCNPJ, formatarWhatsApp, validarCNPJ, validarWhatsApp } from "../lib/validation";
import { FormFields } from "../types";

interface FormularioScreenProps {
  onSubmit: (dados: FormFields) => void;
  isLoading: boolean;
  errorMessage: string | null;
}

export default function FormularioScreen({
  onSubmit,
  isLoading,
  errorMessage
}: FormularioScreenProps) {
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [cnpj, setCnpj] = useState("");

  // Error States
  const [errors, setErrors] = useState<{
    nome?: string;
    whatsapp?: string;
    empresa?: string;
    cnpj?: string;
  }>({});

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatarWhatsApp(e.target.value);
    setWhatsapp(formatted);
    if (errors.whatsapp) {
      setErrors((prev) => ({ ...prev, whatsapp: undefined }));
    }
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatarCNPJ(e.target.value);
    setCnpj(formatted);
    if (errors.cnpj) {
      setErrors((prev) => ({ ...prev, cnpj: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) return;

    const newErrors: typeof errors = {};

    // Validate Name
    if (!nome.trim()) {
      newErrors.nome = "Nome completo é obrigatório";
    } else if (nome.trim().split(" ").length < 2) {
      newErrors.nome = "Insira seu nome e sobrenome completo";
    }

    // Validate WhatsApp
    if (!whatsapp) {
      newErrors.whatsapp = "WhatsApp é obrigatório";
    } else if (!validarWhatsApp(whatsapp)) {
      newErrors.whatsapp = "WhatsApp inválido. Ex: (11) 98765-4321";
    }

    // Validate Empresa
    if (!empresa.trim()) {
      newErrors.empresa = "Nome da empresa é obrigatório";
    }

    // Validate CNPJ
    if (!cnpj) {
      newErrors.cnpj = "CNPJ é obrigatório";
    } else if (!validarCNPJ(cnpj)) {
      newErrors.cnpj = "CNPJ inválido ou incorreto. Verifique os números.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      nomeCompleto: nome,
      whatsapp,
      empresa,
      cnpj
    });
  };

  return (
    <div className="w-full min-h-screen flex flex-col justify-center py-12 px-4 md:px-12 relative overflow-hidden">
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Left Side: Scarcity & Visual benefits */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-5 space-y-6 text-left"
        >
          {/* Unidade Restante Badge */}
          <div className="bg-[#FFFAF0]/90 border border-black/5 rounded-2xl p-6 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF6801]/5 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-center gap-4">
              <div className="bg-[#FF6801] text-black w-12 h-12 flex items-center justify-center rounded-xl font-display text-2xl font-bold btn-glow">
                1
              </div>
              <div>
                <span className="block font-display text-sm text-[#1A1208] uppercase tracking-wider">
                  Unidade Restante
                </span>
                <span className="block font-display text-xs text-[#FF6801] font-bold uppercase tracking-widest animate-pulse">
                  Nesta Condição Exclusiva
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4 font-sans text-sm text-[#4A4030]">
            <h3 className="font-display text-lg text-[#1A1208] uppercase tracking-wider flex items-center gap-2 font-bold">
              <Sparkles className="w-5 h-5 text-[#B8860B]" />
              Benefícios do Upgrade:
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-[#FF6801] font-bold">✓</span>
                <span><strong className="text-[#1A1208]">FMCT 3000</strong> oferece até 45% mais torque e robustez na obra.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FF6801] font-bold">✓</span>
                <span>Economia operacional de longa duração com menor custo de manutenção.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FF6801] font-bold">✓</span>
                <span>Garantia de fábrica e suporte prioritário nacional Feramaq.</span>
              </li>
            </ul>
          </div>
        </motion.div>

        {/* Right Side: The Form Box */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-7"
        >
          <div className="bg-[#FFFAF0]/90 border border-black/5 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
            {/* Top decorative accent bar */}
            <div className="absolute top-0 left-0 w-[4px] h-full bg-[#FF6801]" />

            <div className="text-center md:text-left mb-6">
              <h2 className="font-display text-2xl md:text-3xl text-[#1A1208] uppercase leading-tight font-bold tracking-tight">
                Falta pouco para garantir sua vaga.
              </h2>
              <p className="font-sans text-sm text-[#6B6048] mt-2 leading-relaxed">
                Preencha para um consultor Feramaq validar sua participação e apresentar as condições.
              </p>
            </div>

            {/* Error Banner if submit failed */}
            {errorMessage && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-3 rounded-lg flex items-center gap-2 text-xs mb-4 font-sans">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Field: Nome Completo */}
              <div className="space-y-1">
                <label className="block font-sans text-xs font-bold text-[#4A4030] uppercase tracking-widest flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#857a5e]" />
                  Nome completo
                </label>
                <div className="relative">
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
                    className="w-full bg-white border-2 border-black/10 focus:border-[#FF6801] text-[#1A1208] px-4 py-3 rounded-lg outline-none font-sans text-sm md:text-base transition-colors focus:ring-1 focus:ring-[#FF6801]"
                  />
                </div>
                {errors.nome && (
                  <p className="text-xs text-rose-500 font-sans font-medium">{errors.nome}</p>
                )}
              </div>

              {/* Field: WhatsApp */}
              <div className="space-y-1">
                <label className="block font-sans text-xs font-bold text-[#4A4030] uppercase tracking-widest flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#857a5e]" />
                  WhatsApp
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    disabled={isLoading}
                    value={whatsapp}
                    onChange={handleWhatsappChange}
                    placeholder="(00) 00000-0000"
                    className="w-full bg-white border-2 border-black/10 focus:border-[#FF6801] text-[#1A1208] px-4 py-3 rounded-lg outline-none font-sans text-sm md:text-base transition-colors focus:ring-1 focus:ring-[#FF6801]"
                  />
                </div>
                {errors.whatsapp && (
                  <p className="text-xs text-rose-500 font-sans font-medium">{errors.whatsapp}</p>
                )}
              </div>

              {/* Field: Empresa */}
              <div className="space-y-1">
                <label className="block font-sans text-xs font-bold text-[#4A4030] uppercase tracking-widest flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-[#857a5e]" />
                  Empresa
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    disabled={isLoading}
                    value={empresa}
                    onChange={(e) => {
                      setEmpresa(e.target.value);
                      if (errors.empresa) setErrors((prev) => ({ ...prev, empresa: undefined }));
                    }}
                    placeholder="Nome da sua empresa"
                    className="w-full bg-white border-2 border-black/10 focus:border-[#FF6801] text-[#1A1208] px-4 py-3 rounded-lg outline-none font-sans text-sm md:text-base transition-colors focus:ring-1 focus:ring-[#FF6801]"
                  />
                </div>
                {errors.empresa && (
                  <p className="text-xs text-rose-500 font-sans font-medium">{errors.empresa}</p>
                )}
              </div>

              {/* Field: CNPJ */}
              <div className="space-y-1">
                <label className="block font-sans text-xs font-bold text-[#4A4030] uppercase tracking-widest flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#857a5e]" />
                  CNPJ
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    disabled={isLoading}
                    value={cnpj}
                    onChange={handleCnpjChange}
                    placeholder="00.000.000/0000-00"
                    className="w-full bg-white border-2 border-black/10 focus:border-[#FF6801] text-[#1A1208] px-4 py-3 rounded-lg outline-none font-sans text-sm md:text-base transition-colors focus:ring-1 focus:ring-[#FF6801]"
                  />
                </div>
                {errors.cnpj && (
                  <p className="text-xs text-rose-500 font-sans font-medium">{errors.cnpj}</p>
                )}
              </div>

              {/* Submit button with loader */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#FF6801] hover:bg-[#e05c01] disabled:bg-gray-700 text-white font-display text-base md:text-lg uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer btn-glow active:scale-[0.98]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                      <span>PROCESSANDO...</span>
                    </>
                  ) : (
                    <span>RESGATAR MEU APRIMORAMENTO GRÁTIS</span>
                  )}
                </button>
              </div>

              {/* Trust/Scarcity disclaimers */}
              <div className="flex items-center justify-center gap-2 text-[10px] text-[#857a5e] pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <p className="font-sans leading-tight">
                  Seus dados são usados apenas para contato comercial da Feramaq. Sem spam.
                </p>
              </div>

            </form>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
