// src/auth/authDocusign.ts
import * as React from "react";

const DS_CLIENT_ID = "39f5105e-3669-43c9-b345-e4cb2725f755";
//const DS_ENV = "prod";
const REDIRECT_URI =
  "https://lively-coast-08111f510.3.azurestaticapps.net" + "/";

const AUTH_SERVER =
     "https://account.docusign.com"
    //"https://account-d.docusign.com";

// Scopes básicos (puedes agregar más luego si hace falta)
const SCOPES = "signature cors";

const STORAGE_KEY = "ds_auth";
const STATE_KEY = "ds_oauth_state";
const VERIFIER_KEY = "ds_pkce_verifier";

export type DocusignAuthState = {
  accessToken: string;
  tokenType: string;
  scope: string;
  expiresAt: number; // timestamp en ms
};

/* ========== Helpers PKCE ========== */

function createCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  // hex de 64 chars
  return Array.from(array)
    .map((b) => ("0" + b.toString(16)).slice(-2))
    .join("");
}

async function sha256(input: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  return crypto.subtle.digest("SHA-256", data);
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function createCodeChallenge(verifier: string): Promise<string> {
  const hashed = await sha256(verifier);
  return base64UrlEncode(hashed);
}

/* ========== Storage helpers ========== */

function generateState(): string {
  if ("crypto" in window && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function saveAuth(auth: DocusignAuthState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

export function getStoredAuth(): DocusignAuthState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DocusignAuthState;
    if (!parsed.accessToken || !parsed.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STATE_KEY);
  localStorage.removeItem(VERIFIER_KEY);
}

export function isAuthValid(auth: DocusignAuthState | null): boolean {
  if (!auth) return false;
  // margen de 60s
  return auth.expiresAt > Date.now() + 60_000;
}

/* ========== Login (Authorization Code + PKCE) ========== */

export function startDocusignLogin() {
  if (!DS_CLIENT_ID) {
    console.error("VITE_DS_CLIENT_ID no está configurado");
    return;
  }

  const state = generateState();
  const verifier = createCodeVerifier();

  localStorage.setItem(STATE_KEY, state);
  localStorage.setItem(VERIFIER_KEY, verifier);

  // calculamos el challenge de forma asíncrona
  void (async () => {
    try {
      const challenge = await createCodeChallenge(verifier);

      const authUrl =
        `${AUTH_SERVER}/oauth/auth` +
        `?response_type=code` +
        `&client_id=${encodeURIComponent(DS_CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&scope=${encodeURIComponent(SCOPES)}` +
        `&state=${encodeURIComponent(state)}` +
        `&code_challenge=${encodeURIComponent(challenge)}` +
        `&code_challenge_method=S256`;

      window.location.href = authUrl;
    } catch (e) {
      console.error("Error creando code_challenge PKCE:", e);
    }
  })();
}

/**
 * Procesa ?code=... al volver de DocuSign
 * Intercambia el code por access_token con /oauth/token
 */
export async function handleDocusignRedirect():
  Promise<DocusignAuthState | null> {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code) return null;

  const expectedState = localStorage.getItem(STATE_KEY);
  const verifier = localStorage.getItem(VERIFIER_KEY);

  if (!verifier) {
    console.warn("No hay PKCE verifier guardado, ignorando callback");
    return null;
  }

  if (expectedState && state && expectedState !== state) {
    console.warn("DocuSign state mismatch, ignorando callback");
    return null;
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    client_id: DS_CLIENT_ID!,
    code_verifier: verifier,
  });

  const resp = await fetch(`${AUTH_SERVER}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    console.error("Error en /oauth/token DocuSign:", resp.status, txt);
    throw new Error("No se pudo obtener token de DocuSign");
  }

  const data = await resp.json() as {
    access_token: string;
    token_type: string;
    scope: string;
    expires_in: number;
  };

  const expiresAt = Date.now() + data.expires_in * 1000;

  const auth: DocusignAuthState = {
    accessToken: data.access_token,
    tokenType: data.token_type,
    scope: data.scope,
    expiresAt,
  };

  saveAuth(auth);
  localStorage.removeItem(STATE_KEY);
  localStorage.removeItem(VERIFIER_KEY);

  // limpiar query (?code=&state=) de la URL
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  window.history.replaceState({}, document.title, url.pathname + url.search);

  return auth;
}

/* ========== Hook para React ========== */

export function useDocusignAuth() {
  const [auth, setAuth] = React.useState<DocusignAuthState | null>(null);

  React.useEffect(() => {
    void (async () => {
      // 1. ¿venimos de DocuSign con ?code=...?
      try {
        const fromRedirect = await handleDocusignRedirect();
        if (fromRedirect) {
          setAuth(fromRedirect);
          return;
        }
      } catch (e) {
        console.error(e);
      }

      // 2. Si no, intentar leer de localStorage
      const stored = getStoredAuth();
      if (stored && isAuthValid(stored)) {
        setAuth(stored);
      } else if (stored) {
        clearAuth();
      }
    })();
  }, []);

  const login = React.useCallback(() => {
    startDocusignLogin();
  }, []);

  const logout = React.useCallback(() => {
    clearAuth();
    setAuth(null);
  }, []);

  return {
    auth,
    isConnected: isAuthValid(auth),
    login,
    logout,
  };
}
