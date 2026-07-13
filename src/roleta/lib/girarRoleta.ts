import { Prize, TrackingFields } from "../types";

export interface GirarResultado {
  ok: boolean;
  prize?: Prize;
  reason?: "ja_participou" | "esgotado" | "erro";
  message?: string;
}

export async function girarRoleta(
  idToken: string,
  celular: string,
  tracking: TrackingFields
): Promise<GirarResultado> {
  try {
    const response = await fetch("/api/girar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, celular, tracking }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.ok) {
      return {
        ok: false,
        reason: result.reason || "erro",
        message: result.message || "Erro ao girar a roleta. Tente novamente.",
      };
    }

    return { ok: true, prize: result.prize };
  } catch (err) {
    console.error("Erro ao girar a roleta:", err);
    return {
      ok: false,
      reason: "erro",
      message: "Não foi possível conectar ao servidor. Verifique sua conexão.",
    };
  }
}
