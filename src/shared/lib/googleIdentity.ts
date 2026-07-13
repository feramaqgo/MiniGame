// Client ID público do OAuth do Google (não é segredo — restrito por
// domínio autorizado no Google Cloud Console, não por sigilo).
// TODO: substituir pelo Client ID real assim que criado no Google Cloud Console.
export const GOOGLE_CLIENT_ID = "SUBSTITUA_PELO_CLIENT_ID.apps.googleusercontent.com";

interface GoogleCredentialResponse {
  credential: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              shape?: "rectangular" | "pill" | "circle" | "square";
              width?: number;
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
            }
          ) => void;
        };
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Falha ao carregar o script do Google"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Carrega o script do Google, inicializa o Sign-In e renderiza o botão
 * dentro do elemento informado. `onCredential` recebe o ID token (JWT).
 */
export async function renderGoogleButton(
  container: HTMLElement,
  onCredential: (idToken: string) => void
): Promise<void> {
  await loadGoogleScript();

  window.google!.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (response) => onCredential(response.credential),
  });

  window.google!.accounts.id.renderButton(container, {
    type: "standard",
    theme: "filled_black",
    size: "large",
    shape: "pill",
    text: "continue_with",
    width: 320,
  });
}

/** Decodifica só a parte de dados do JWT (sem verificar assinatura — isso
 * é feito no servidor). Usado no front só pra mostrar nome/foto na hora. */
export function decodeGooglePayload(idToken: string): {
  name: string | null;
  email: string | null;
  picture: string | null;
} {
  try {
    const payload = idToken.split(".")[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return { name: json.name ?? null, email: json.email ?? null, picture: json.picture ?? null };
  } catch {
    return { name: null, email: null, picture: null };
  }
}
