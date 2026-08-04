// Registro do service worker + captura do convite de instalação.
//
// O Chrome dispara `beforeinstallprompt` quando a página é instalável, mas o
// evento só pode ser usado uma vez e precisa ser guardado — por isso o
// capturamos aqui e expomos via `onInstalavel`.

/** Evento do Chrome que permite abrir o diálogo de instalação. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let promptGuardado: BeforeInstallPromptEvent | null = null;
const inscritos = new Set<(disponivel: boolean) => void>();

function avisar(disponivel: boolean) {
  inscritos.forEach((fn) => fn(disponivel));
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // evita o mini-infobar; abrimos no nosso botão
    promptGuardado = e as BeforeInstallPromptEvent;
    avisar(true);
  });

  window.addEventListener("appinstalled", () => {
    promptGuardado = null;
    avisar(false);
  });
}

/** Já está rodando como app instalado (sem barra do navegador)? */
export function rodandoInstalado(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    // iOS não implementa display-mode; usa esta propriedade própria.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/** Avisa quando o convite de instalação fica disponível (ou some). */
export function onInstalavel(fn: (disponivel: boolean) => void): () => void {
  inscritos.add(fn);
  fn(!!promptGuardado);
  return () => inscritos.delete(fn);
}

/** Abre o diálogo nativo de instalação. Devolve true se o usuário aceitou. */
export async function instalarApp(): Promise<boolean> {
  if (!promptGuardado) return false;
  const evento = promptGuardado;
  promptGuardado = null;
  avisar(false);
  await evento.prompt();
  const { outcome } = await evento.userChoice;
  return outcome === "accepted";
}

/** Registra o service worker (silencioso — falha não pode quebrar o app). */
export function registrarServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) => console.warn("Service worker não registrado:", err));
  });
}
