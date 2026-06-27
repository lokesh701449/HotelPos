import { userRepository } from "../repositories/user.repository";
import { tenantRepository } from "../repositories/tenant.repository";
import { ConflictError, UnauthorizedError, NotFoundError, BadRequestError } from "../utils/errors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-pos-key-2026";

interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    tenantId: string;
  };
  token: string;
}

export class AuthService {
  private generateToken(userId: string, role: string, tenantId: string): string {
    return jwt.sign({ id: userId, role, tenantId }, JWT_SECRET, {
      expiresIn: "24h",
    });
  }

  async register(data: any): Promise<AuthResponse> {
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError("Email address is already in use");
    }

    let tenantId = data.tenantId;

    // If no tenantId is provided, we must create a new tenant
    if (!tenantId) {
      if (!data.tenantName) {
        throw new BadRequestError("Tenant name is required when creating a new tenant");
      }
      const tenant = await tenantRepository.create({
        name: data.tenantName,
        brandName: data.brandName || data.tenantName,
        address: data.address || "",
      });
      tenantId = tenant.id;
    } else {
      // Validate tenant exists
      const tenant = await tenantRepository.findById(tenantId);
      if (!tenant) {
        throw new NotFoundError("Associated tenant not found");
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await userRepository.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      tenantId,
    });

    const token = this.generateToken(user.id, user.role, user.tenantId);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
      token,
    };
  }

  async login(credentials: any): Promise<AuthResponse> {
    const user = await userRepository.findByEmail(credentials.email);
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(credentials.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const token = this.generateToken(user.id, user.role, user.tenantId);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
      token,
    };
  }

  async getMe(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        brandName: user.tenant.brandName,
        address: user.tenant.address,
      },
    };
  }
}

export const authService = new AuthService();
