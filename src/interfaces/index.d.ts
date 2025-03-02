import { JwtPayload } from "jsonwebtoken";

declare global {
    namespace Express {
        interface Request {
            user: JwtPayload;
        }
    }
}

const JwtPayload = {
  id: string,
  email: string,
  name?: string,
  role: string,
  iat?: number,
  exp?: number,
};
