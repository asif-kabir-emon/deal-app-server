import jwt, { JwtPayload } from 'jsonwebtoken';

const generateToken = (
  payload: JwtPayload,
  secret: string,
  expiresIn: string
) => {
  const token = jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn,
  } as jwt.SignOptions);

  return token;
};

const verifyToken = (token: string, secret: string) => {
  const decodedData = jwt.verify(token, secret) as JwtPayload;

  return decodedData;
};

export const jwtHelper = {
  generateToken,
  verifyToken,
};
