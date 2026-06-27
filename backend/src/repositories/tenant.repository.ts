import { prisma } from "../config/db";
import { Tenant, Prisma } from "@prisma/client";

export class TenantRepository {
  async findById(id: string): Promise<Tenant | null> {
    return prisma.tenant.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.TenantCreateInput): Promise<Tenant> {
    return prisma.tenant.create({
      data,
    });
  }
}

export const tenantRepository = new TenantRepository();
