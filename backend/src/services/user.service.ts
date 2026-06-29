import { userRepository } from "../repositories/user.repository";
import { NotFoundError } from "../utils/errors";

export class UserService {
  async getStaff(tenantId: string) {
    return userRepository.findAllByTenant(tenantId);
  }
}

export const userService = new UserService();
