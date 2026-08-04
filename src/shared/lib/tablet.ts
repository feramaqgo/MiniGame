// Senha da equipe no tablet do estande — validada uma vez em /api/tablet-auth
// e guardada no localStorage do aparelho. Os endpoints do tablet
// (validar-codigo, girar) exigem essa senha em cada chamada.

const SENHA_KEY = "tablet_senha";

export function getTabletSenha(): string | null {
  return localStorage.getItem(SENHA_KEY);
}

export function saveTabletSenha(senha: string) {
  localStorage.setItem(SENHA_KEY, senha);
}

export function clearTabletSenha() {
  localStorage.removeItem(SENHA_KEY);
}
