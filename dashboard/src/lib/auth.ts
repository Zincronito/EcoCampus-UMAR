import { jwtVerify, SignJWT } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.SECRET_KEY || "cambia-esta-clave-en-produccion"
);

export async function createToken(
  userId: string,
  role: string,
  expiresIn: string = "24h"
) {
  return new SignJWT({ sub: userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(SECRET);
}

export async function verifyToken(token: string) {
  try {
    const verified = await jwtVerify(token, SECRET);
    return verified.payload;
  } catch (err) {
    return null;
  }
}