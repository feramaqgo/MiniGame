// Giro da roleta (fluxo tablet): recebe o código do participante + a senha
// do tablet, chama a RPC girar_roleta_codigo (sorteio + decremento atômico +
// marca o código como usado) e devolve o prêmio. O prêmio fica gravado na
// linha do participante em roleta_participants (código, nome, e-mail,
// celular e prêmio juntos).
//
// Dois caminhos chegam aqui:
//   * online  — `prizeId` nulo, o servidor sorteia;
//   * offline — o wi-fi do pavilhão caiu, o tablet sorteou no navegador pra
//     a pessoa ver o brinde na hora, e isto é a fila sincronizando depois.
//     `prizeId` vem preenchido e aqui só registramos a baixa.
//
// O código do participante é a chave de idempotência: a fila reenvia até
// obter resposta, então o mesmo giro pode chegar duas vezes — e a RPC devolve
// o mesmo prêmio em vez de sortear de novo.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, message: "Method not allowed" });
    return;
  }

  const { codigo, senha, prizeId } = req.body || {};

  if (!process.env.ADMIN_PASSPHRASE || senha !== process.env.ADMIN_PASSPHRASE) {
    res.status(401).json({ ok: false, message: "Tablet não autorizado" });
    return;
  }

  const codigoNum = Number.parseInt(codigo, 10);
  if (!Number.isInteger(codigoNum) || codigoNum <= 0) {
    res.status(400).json({ ok: false, message: "Código inválido" });
    return;
  }

  let rpcResponse;
  try {
    rpcResponse = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/girar_roleta_codigo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ p_codigo: codigoNum, p_prize_id: prizeId || null }),
    });
  } catch (err) {
    console.error("Erro de conexão ao girar a roleta:", err);
    res.status(500).json({ ok: false, message: "Erro de conexão com o servidor" });
    return;
  }

  if (!rpcResponse.ok) {
    const errorBody = await rpcResponse.json().catch(() => ({}));
    const message = errorBody?.message || "";

    if (message === "CODIGO_INVALIDO") {
      res.status(404).json({
        ok: false,
        reason: "codigo_invalido",
        message: "Código não encontrado.",
      });
      return;
    }

    if (message === "JA_PARTICIPOU") {
      res.status(409).json({
        ok: false,
        reason: "ja_participou",
        message: "Esse código já girou a roleta.",
      });
      return;
    }

    if (message === "ESGOTADO") {
      res.status(409).json({
        ok: false,
        reason: "esgotado",
        message: "Os prêmios acabaram.",
      });
      return;
    }

    // Inclui PREMIO_INVALIDO (brinde sorteado offline que sumiu do catálogo).
    // 5xx de propósito: a fila do tablet mantém o item e continua tentando,
    // em vez de descartar um giro que já rendeu brinde entregue em mãos.
    console.error("Erro ao girar a roleta:", rpcResponse.status, errorBody);
    res.status(502).json({ ok: false, reason: "erro", message: "Erro ao girar a roleta" });
    return;
  }

  const rows = await rpcResponse.json();
  const resultado = rows?.[0];

  if (!resultado) {
    console.error("Resposta inesperada do girar_roleta_codigo:", rows);
    res.status(502).json({ ok: false, reason: "erro", message: "Erro ao girar a roleta" });
    return;
  }

  const { prize_id: prizeIdFinal, prize_name: prizeName } = resultado;

  res.status(200).json({ ok: true, prize: { id: prizeIdFinal, name: prizeName } });
}
