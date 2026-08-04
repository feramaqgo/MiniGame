// Validação do código no tablet: confere a senha do tablet, busca o
// participante pelo código e devolve o primeiro nome (pra recepção do Rino
// cumprimentar a pessoa). Não devolve e-mail/celular — o tablet não precisa.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, message: "Method not allowed" });
    return;
  }

  const { codigo, senha } = req.body || {};

  if (!process.env.ADMIN_PASSPHRASE || senha !== process.env.ADMIN_PASSPHRASE) {
    res.status(401).json({ ok: false, message: "Tablet não autorizado" });
    return;
  }

  const codigoNum = Number.parseInt(codigo, 10);
  if (!Number.isInteger(codigoNum) || codigoNum <= 0) {
    res.status(400).json({ ok: false, reason: "invalido", message: "Código inválido" });
    return;
  }

  let response;
  try {
    response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/roleta_participants` +
        `?codigo=eq.${codigoNum}&select=codigo,google_name,codigo_usado`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
  } catch (err) {
    console.error("Erro de conexão ao validar código:", err);
    res.status(500).json({ ok: false, reason: "erro", message: "Erro de conexão" });
    return;
  }

  if (!response.ok) {
    console.error("Erro ao validar código:", response.status, await response.text());
    res.status(502).json({ ok: false, reason: "erro", message: "Erro ao validar código" });
    return;
  }

  const rows = await response.json();
  const participante = rows?.[0];

  if (!participante) {
    res.status(404).json({
      ok: false,
      reason: "nao_encontrado",
      message: "Código não encontrado. Confira o número no seu celular.",
    });
    return;
  }

  if (participante.codigo_usado) {
    res.status(409).json({
      ok: false,
      reason: "ja_usado",
      message: "Esse código já girou a roleta.",
    });
    return;
  }

  res.status(200).json({
    ok: true,
    codigo: participante.codigo,
    nome: participante.google_name || null,
  });
}
