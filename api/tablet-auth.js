// Desbloqueio do tablet do estande: valida a senha da equipe (a mesma do
// painel admin). O front guarda a senha no localStorage do aparelho e a
// reenvia nos endpoints do tablet (validar-codigo, girar).

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, message: "Method not allowed" });
    return;
  }

  const { senha } = req.body || {};

  if (!process.env.ADMIN_PASSPHRASE || senha !== process.env.ADMIN_PASSPHRASE) {
    res.status(401).json({ ok: false, message: "Senha incorreta" });
    return;
  }

  res.status(200).json({ ok: true });
}
