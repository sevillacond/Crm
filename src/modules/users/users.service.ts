import { usersRepository } from './users.repository.ts';
import { User } from '../../types/index.ts';

class UsersService {
  async getAll(instanceId?: string): Promise<User[]> {
    return usersRepository.getAll(instanceId);
  }

  async getById(id: string, instanceId?: string): Promise<User | null> {
    return usersRepository.getById(id, instanceId);
  }

  async getByEmailWithAuth(email: string, instanceId?: string) {
    return usersRepository.getByEmailWithAuth(email, instanceId);
  }

  async createUser(user: User, rawPassword?: string, instanceId?: string): Promise<User> {
    return usersRepository.create(user, rawPassword, instanceId);
  }
}

export const usersService = new UsersService();
