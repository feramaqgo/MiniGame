export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, message: "Method not allowed" });
    return;
  }

  try {
    const query = new URLSearchParams({
      select: "google_name,prize_id",
      prize_id: "not.is.null",
      order: "created_at.desc", // Assumindo que created_at existe
      limit: "1",
    });

    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/roleta_participants?${query}`, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    if (!response.ok) {
      // Se a coluna created_at falhar, vamos tentar id.desc como fallback seguro
      const fallbackQuery = new URLSearchParams({
        select: "google_name,prize_id",
        prize_id: "not.is.null",
        order: "id.desc",
        limit: "1",
      });

      const fallbackResponse = await fetch(`${process.env.SUPABASE_URL}/rest/v1/roleta_participants?${fallbackQuery}`, {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      });

      if (!fallbackResponse.ok) {
        const text = await fallbackResponse.text();
        console.error("Erro ao buscar último ganhador:", fallbackResponse.status, text);
        res.status(502).json({ ok: false, message: "Erro ao buscar último ganhador" });
        return;
      }
      
      const parts = await fallbackResponse.json();
      if (parts.length === 0) {
        res.status(200).json({ ok: true, winner: null });
        return;
      }
      return processWinner(parts[0], res);
    }

    const participants = await response.json();
    if (participants.length === 0) {
      res.status(200).json({ ok: true, winner: null });
      return;
    }

    await processWinner(participants[0], res);
  } catch (err) {
    console.error("Erro de conexão ao buscar último ganhador:", err);
    res.status(500).json({ ok: false, message: "Erro de conexão com o servidor" });
  }
}

async function processWinner(latest, res) {
  try {
    const prizeResponse = await fetch(`${process.env.SUPABASE_URL}/rest/v1/roleta_prizes?id=eq.${latest.prize_id}&select=name&limit=1`, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    let prizeName = "um brinde";
    if (prizeResponse.ok) {
      const prizes = await prizeResponse.json();
      if (prizes.length > 0 && prizes[0].name) {
        prizeName = prizes[0].name;
      }
    }

    const firstName = latest.google_name ? latest.google_name.trim().split(" ")[0] : "Um visitante";

    res.status(200).json({ 
      ok: true, 
      winner: { 
        name: firstName, 
        prizeName: prizeName 
      } 
    });
  } catch (err) {
    console.error("Erro processWinner:", err);
    res.status(502).json({ ok: false, message: "Erro ao processar ganhador" });
  }
}
