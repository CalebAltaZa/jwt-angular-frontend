/** Contratos compartidos con las APIs FastAPI. */

export interface JwtClaims {
  sub: string; // username del claim: define qué items puede ver el usuario
  dn: string; // distinguished name en LDAP
  iss: string; // jwt-ldap-auth
  aud: string; // jwt-items
  iat: number;
  nbf: number;
  exp: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  username: string;
  dn: string;
}

export const CATEGORIES = [
  'Películas',
  'Series',
  'Cómics',
  'Personajes',
  'Videojuegos',
  'Mercancía',
  'Otros',
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Item {
  id: number;
  username: string;
  name: string;
  category: string;
  image_url: string | null;
  note: string | null;
  favorite: boolean;
  created_at: string;
}

export interface ItemsResponse {
  username: string;
  count: number;
  items: Item[];
}

export interface ItemCreate {
  name: string;
  category: string;
  image_url: string | null;
  note: string | null;
}
