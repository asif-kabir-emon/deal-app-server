import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload;
    }
  }
}

interface JwtPayload {
  id: string;
  email: string;
  role: string;
  name?: string;
  avatar?: string;
  iat?: number;
  exp?: number;
}
