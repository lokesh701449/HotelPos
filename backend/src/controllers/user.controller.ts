import { Request, Response, NextFunction } from "express";
import { userService } from "../services/user.service";
import { authService } from "../services/auth.service";

export class UserController {
  async getStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user.tenantId;
      const staff = await userService.getStaff(tenantId);
      res.status(200).json({ success: true, data: staff });
    } catch (err) {
      next(err);
    }
  }

  async createStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user.tenantId;
      // Re-use auth service to register a user within the same tenant
      const result = await authService.register({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        role: req.body.role,
        tenantId, // Force the new user to belong to the manager's tenant
      });

      res.status(201).json({ success: true, data: result.user });
    } catch (err) {
      next(err);
    }
  }
}

export const userController = new UserController();
