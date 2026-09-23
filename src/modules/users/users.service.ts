import { usersRepository } from './users.repository.ts';
import { User } from '../../types/index.ts';

class UsersService {
  async getAll(): Promise<User[]> {
    return usersRepository.getAll();
  }

  async getById(id: string): Promise<User | null> {
    return usersRepository.getById(id);
  }

  async getByEmailWithAuth(email: string) {
    return usersRepository.getByEmailWithAuth(email);
  }

  async createUser(user: User, rawPassword?: string): Promise<User> {
    return usersRepository.create(user, rawPassword);
  }
}

export const usersService = new UsersService();
