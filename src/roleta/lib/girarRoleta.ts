import { Prize } from "../types";
import { enfileirar, sincronizar } from "../../shared/lib/outbox";
import { sortearLocalmente } from "../../shared/lib/premios";

export interface GirarResultado {
  ok: boolean;
  prize?: Prize;
  /** Sorteado aqui no tablet, sem rede — vai subir pela fila depois. */
  offline?: boolean;
  reason?: "ja_participou" | "esgotado" | "codigo_invalido" | "erro";
  message?: string;
}

/**
 * Gira a roleta pelo código do participante (fluxo tablet).
 *
 * Tenta o servidor primeiro. Se a rede falhar — e wi-fi de pavilhão cai
 * justamente no pico do movimento — sorteia aqui mesmo, ponderado por estoque
 * (a mesma regra do servidor), e joga o giro numa fila que sobe sozinha
 * quando a conexão voltar. O visitante vê o brinde na hora em vez de um erro.
 *
 * Recusa do servidor (4xx) NÃO vira sorteio local: se ele disse "já
 * participou" ou "esgotado", inventar um brinde aqui seria pior do que
 * mostrar o motivo.
 */
export async function girarRoleta(
  codigo: number,
  senha: string | null
): Promise<GirarResultado> {
  const corpo = { codigo, senha, prizeId: null as string | null };

  try {
    const response = await fetch("/api/girar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    });

    const result = await response.json().catch(() => ({}));

    if (response.ok && result.ok) {
      return { ok: true, prize: result.prize };
    }

    // Recusa definitiva: o servidor respondeu e disse não.
    if (response.status >= 400 && response.status < 500) {
      return {
        ok: false,
        reason: result.reason || "erro",
        message: result.message || "Erro ao girar a roleta. Tente novamente.",
      };
    }

    // 5xx — servidor com problema. Sorteia aqui e enfileira.
    return sortearOffline(codigo, senha);
  } catch (err) {
    console.error("Sem conexão ao girar a roleta:", err);
    return sortearOffline(codigo, senha);
  }
}

function sortearOffline(codigo: number, senha: string | null): GirarResultado {
  const premio = sortearLocalmente();

  if (!premio) {
    // Sem cache de prêmios não dá pra inventar um brinde com honestidade.
    return {
      ok: false,
      reason: "erro",
      message: "Sem conexão agora. Chame o atendente pra registrar seu prêmio.",
    };
  }

  // O código do participante é a chave de idempotência: reenviar não gera
  // um segundo sorteio, a RPC devolve o mesmo prêmio.
  enfileirar(String(codigo), "/api/girar", { codigo, senha, prizeId: premio.id });
  void sincronizar();

  return { ok: true, prize: premio, offline: true };
}
