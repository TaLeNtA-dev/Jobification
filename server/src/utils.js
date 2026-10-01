import { SignJWT, jwtVerify } from 'jose';

const accessSec = new TextEncoder().encode(process.env.ACCESS_TOKEN);
const refreshSec = new TextEncoder().encode(process.env.REFRESH_TOKEN);

export async function createAccessToken({ id, userName }) {
  return new SignJWT({ userName })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(id))
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(accessSec);
}
export async function createRefreshToken({ id }) {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(id))
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(refreshSec);
}

export async function verifyAccessToken(token) {
  const { payload } = await jwtVerify(token, accessSec, {
    algorithms: ['HS256'],
  });
  return payload;
}
export async function verifyRefreshToken(token) {
  const { payload } = await jwtVerify(token, refreshSec, {
    algorithms: ['HS256'],
  });
  return payload;
}
