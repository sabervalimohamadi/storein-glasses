export interface JwtPayload {
  sub: string;
  phone: string;
  iat?: number;
  exp?: number;
}
export interface JwtRefreshPayload extends JwtPayload {
  refreshToken?: string;
}
