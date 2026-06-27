import { tableRepository } from "../repositories/table.repository";
import { ConflictError, NotFoundError } from "../utils/errors";
import { socketService } from "../socket/socket.service";

export class TableService {
  async getAllTables(tenantId: string) {
    return tableRepository.findAll(tenantId);
  }

  async getTableById(id: string, tenantId: string) {
    const table = await tableRepository.findById(id, tenantId);
    if (!table) {
      throw new NotFoundError("Table not found");
    }
    return table;
  }

  async createTable(tenantId: string, data: any) {
    const existing = await tableRepository.findByNumber(data.number, tenantId);
    if (existing) {
      throw new ConflictError(`Table number ${data.number} already exists`);
    }

    const table = await tableRepository.create({
      ...data,
      tenantId,
      status: "AVAILABLE",
    });

    socketService.emitToTenant(tenantId, "table-updated", table);
    return table;
  }

  async updateTable(id: string, tenantId: string, data: any) {
    const table = await this.getTableById(id, tenantId);

    if (data.number) {
      const existing = await tableRepository.findByNumber(data.number, tenantId);
      if (existing && existing.id !== id) {
        throw new ConflictError(`Table number ${data.number} already exists`);
      }
    }

    const updatedTable = await tableRepository.update(id, tenantId, data);
    socketService.emitToTenant(tenantId, "table-updated", updatedTable);
    return updatedTable;
  }

  async deleteTable(id: string, tenantId: string) {
    await this.getTableById(id, tenantId);
    const deleted = await tableRepository.delete(id, tenantId);
    socketService.emitToTenant(tenantId, "table-updated", { id, deleted: true });
    return deleted;
  }
}

export const tableService = new TableService();
