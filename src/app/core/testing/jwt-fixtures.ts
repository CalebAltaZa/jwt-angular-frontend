/**
 * Utilidades compartidas por las pruebas: fabrica JWT falsos (el navegador sólo
 * los decodifica, la firma se valida en el backend).
 */

export function makeToken(overrides: Record<string, unknown> = {}, expired = false): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    sub: 'caleb',
    dn: 'uid=caleb,ou=users,dc=example,dc=com',
    iss: 'jwt-ldap-auth',
    aud: 'jwt-items',
    iat: now,
    nbf: now,
    exp: expired ? now - 3600 : now + 1800,
    ...overrides,
  };

  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `${encode(header)}.${encode(payload)}.firma-falsa-para-pruebas`;
}
