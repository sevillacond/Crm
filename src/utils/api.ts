import { User } from '../types/index.ts';

let currentAuthToken: string | null = typeof window !== 'undefined' ? sessionStorage.getItem('enlace_auth_token') : null;

export function getAuthToken(): string | null {
  return currentAuthToken;
}

export function setAuthToken(token: string | null) {
  currentAuthToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      sessionStorage.setItem('enlace_auth_token', token);
    } else {
      sessionStorage.removeItem('enlace_auth_token');
    }
  }
}

/**
 * Autentica o operador com credenciais válidas e armazena o token JWT assinado pela instância.
 */
export async function loginWithCredentials(
  email: string,
  password = 'Enlace@2026!'
): Promise<{ token: string; user: User } | null> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn('[API Auth] Falha ao autenticar:', err);
      return null;
    }

    const data = await res.json();
    setAuthToken(data.token);
    return data;
  } catch (err) {
    console.warn('[API Auth] Erro ao comunicar com endpoint de autenticação:', err);
    return null;
  }
}

/**
 * Encerra a sessão ativa do operador e revoga o token JWT no repositório de sessões do servidor.
 */
export async function logoutCurrentSession(): Promise<void> {
  const token = getAuthToken();
  if (token) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch {
      // Ignora falha de rede no logout
    }
  }
  setAuthToken(null);
}

/**
 * Cliente HTTP autenticado com proteção contra injeção de headers forjados (P0.9 e P0.10).
 * Injeta automaticamente o Bearer JWT e expurga x-user-id / x-instance-id.
 */
export async function authenticatedFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Garantia P0.9 / P0.10: Nunca enviar headers forjados pelo cliente
  headers.delete('x-user-id');
  headers.delete('x-user-role');
  headers.delete('x-instance-id');

  return fetch(path, {
    ...options,
    headers
  });
}
