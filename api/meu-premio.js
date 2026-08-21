// Consulta do próprio prêmio, feita pelo CELULAR do visitante.
//
// O tablet fica preso no totem, então a pessoa não pode levá-lo até o
// atendente. O comprovante precisa viajar com ela — e o caminho preferido é
// o celular, que ela já tem na mão desde o cadastro.
//
// Enquanto a tela do código estiver aberta, o celular pergunta aqui de tempos
// em tempos se o giro já aconteceu. Assim que o brinde sai no tablet, ele
// aparece no celular sozinho, sem a pessoa precisar fazer nada.
//
// AUTORIZAÇÃO: exige o código E o celular do cadastro. O código sozinho é
// sequencial (1, 2, 3…) e alguém poderia varrer os vizinhos pra ver o que os
// outros ganharam; exigir o telefone junto significa que só quem se cadastrou
// consulta a própria linha. Nada de PII sai daqui além do brinde.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, message: "Method not allowed" });
    return;
  }

  const { codigo, celular } = req.body || {};

  const codigoNum = Number.parseInt(codigo, 10);
  const celularDigitos = (celular || "").replace(/\D/g, "");

  if (!Number.isInteger(codigoNum) || codigoNum <= 0 || celularDigitos.length < 10) {
    res.status(400).json({ ok: false, message: "Dados inválidos" });
    return;
  }

  try {
    const r = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/roleta_participants` +
        `?codigo=eq.${codigoNum}` +
        `&phone_normalized=eq.${encodeURIComponent(celularDigitos)}` +
        `&select=codigo,google_name,prize_name,codigo_usado`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    if (!r.ok) throw new Error(await r.text());

    const participante = (await r.json())?.[0];

    // Código e telefone não batem: não confirmamos nem negamos a existência
    // do código, só respondemos que não há prêmio.
    if (!participante) {
      res.setHeader("Cache-Control", "no-store");
      res.status(200).json({ ok: true, premio: null });
      return;
    }

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
      ok: true,
      premio: participante.prize_name || null,
      jaGirou: !!participante.codigo_usado,
      nome: participante.google_name || null,
    });
  } catch (err) {
    console.error("Erro ao consultar prêmio:", err);
    res.status(502).json({ ok: false, message: "Erro ao consultar seu prêmio" });
  }
}
