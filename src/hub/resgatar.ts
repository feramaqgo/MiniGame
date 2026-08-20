import { LeadData } from "../shared/types";
import { enfileirar, sincronizar } from "../shared/lib/outbox";
import { sortearLocalmente, Premio } from "../shared/lib/premios";

export interface ResultadoResgate {
  ok: boolean;
  prize?: Premio;
  /** Sorteado no navegador, sem rede — vai subir pela fila depois. */
  offline?: boolean;
  reason?: "ja_participou" | "esgotado" | "partida_invalida" | "erro";
  message?: string;
}

/**
 * Cadastra o visitante e gira a roleta.
 *
 * Tenta o servidor primeiro. Se a rede falhar (ou vier 5xx), sorteia aqui
 * mesmo — ponderado por estoque, mesma regra do servidor — e joga a
 * participação inteira na fila. O visitante vê o brinde na hora e o lead sobe
 * quando a conexão voltar; ninguém vai embora achando que não funcionou.
 *
 * Recusa do servidor (4xx) NÃO vira sorteio local: se ele disse "já
 * participou" ou "esgotado", inventar um brinde aqui seria pior.
 */
export async function resgatarPremio(
  partidaId: string,
  lead: LeadData
): Promise<ResultadoResgate> {
  const params = new URLSearchParams(window.location.search);
  const corpo = {
    partidaId,
    lead,
    prizeId: null as string | null,
    tracking: {
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      utm_content: params.get("utm_content"),
      utm_term: params.get("utm_term"),
    },
  };

  try {
    const r = await fetch("/api/resgatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    });

    const dados = await r.json().catch(() => ({}));

    if (r.ok && dados?.ok) {
      return { ok: true, prize: dados.prize };
    }

    // Recusa definitiva: o servidor respondeu e disse não.
    if (r.status >= 400 && r.status < 500) {
      return {
        ok: false,
        reason: dados?.reason || "erro",
        message: dados?.message || "Não foi possível resgatar seu brinde.",
      };
    }

    // 5xx — servidor com problema. Sorteia aqui e enfileira.
    return sortearOffline(partidaId, corpo);
  } catch {
    // Sem rede.
    return sortearOffline(partidaId, corpo);
  }
}

function sortearOffline(
  partidaId: string,
  corpo: { partidaId: string; lead: LeadData; prizeId: string | null; tracking: unknown }
): ResultadoResgate {
  const premio = sortearLocalmente();

  if (!premio) {
    // Sem cache de prêmios não dá pra inventar um brinde. Guarda o cadastro
    // mesmo assim: o lead é o que não pode se perder.
    enfileirar(partidaId, "/api/resgatar", corpo);
    void sincronizar();
    return {
      ok: false,
      reason: "erro",
      message: "Sem conexão agora. Seu cadastro foi salvo e o brinde será liberado pelo atendente.",
    };
  }

  enfileirar(partidaId, "/api/resgatar", { ...corpo, prizeId: premio.id });
  void sincronizar();
  return { ok: true, prize: premio, offline: true };
}
