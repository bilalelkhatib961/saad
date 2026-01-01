import { SignJWT, jwtVerify } from "jose";

export const adminAuthCookieName = "admin_session";

const jwtIssuer = "next-js-app-router-gallery";
const jwtAudience = "admin";

const getJwtSecret = () => {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
};

export async function signAdminToken(payload: {
  userId: string;
  username: string;
}) {
  return new SignJWT({ username: payload.username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(jwtIssuer)
    .setAudience(jwtAudience)
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifyAdminToken(token: string) {
  const { payload } = await jwtVerify(token, getJwtSecret(), {
    issuer: jwtIssuer,
    audience: jwtAudience,
  });
  return payload;
}
