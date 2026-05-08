import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email: email.toLowerCase() } });
  }

  findByUsername(username: string): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { username: username.trim() },
    });
  }

  async create(data: {
    email: string;
    username: string;
    passwordHash: string;
  }): Promise<User> {
    const user = this.usersRepo.create({
      email: data.email.toLowerCase(),
      username: data.username,
      passwordHash: data.passwordHash,
    });
    return this.usersRepo.save(user);
  }
}
