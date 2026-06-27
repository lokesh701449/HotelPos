import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-pos-key-2026";

export interface UserPayload {
  id: string;
  role: "ADMIN" | "MANAGER" | "WAITER" | "CHEF" | "CASHIER";
  tenantId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Authentication token required");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;

    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError("Invalid or expired authentication token"));
    } else {
      next(err);
    }
  }
};

export const authorizeRoles = (...roles: ("ADMIN" | "MANAGER" | "WAITER" | "CHEF" | "CASHIER")[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError("Authentication required"));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError("Access denied: insufficient permissions"));
      return;
    }

    next();
  };
};
