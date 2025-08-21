import type { JwtPayload } from "../../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload; // ahora TS sabe que req.user existe
    }
  }
}
