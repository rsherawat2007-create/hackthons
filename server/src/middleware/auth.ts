import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { HttpError } from "../utils/errors.js";

export type AuthPayload = {
  userId: string;
  role: Role;
  email: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new HttpError(401, "Authentication required");
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret") as AuthPayload;
    req.user = payload;
    next();
  } catch {
    throw new HttpError(401, "Invalid or expired session");
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new HttpError(401, "Authentication required");
    if (!roles.includes(req.user.role)) {
      throw new HttpError(403, "You do not have permission to access this resource");
    }
    next();
  };
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET || "dev-secret") as AuthPayload;
    } catch {
      /* ignore invalid optional token */
    }
  }
  next();
}
