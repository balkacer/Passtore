import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Credential } from './credential.entity';
import { CreateCredentialDto } from './dto/create-credential.dto';
import { UpdateCredentialDto } from './dto/update-credential.dto';

@Injectable()
export class CredentialsService {
  constructor(
    @InjectRepository(Credential)
    private readonly repo: Repository<Credential>,
  ) {}

  async create(userId: string, dto: CreateCredentialDto): Promise<Credential> {
    const row = this.repo.create({
      userId,
      alias: dto.alias,
      platformName: dto.platformName,
      url: dto.url ?? null,
      loginUsername: dto.loginUsername,
      encryptedPassword: dto.encryptedPassword,
      iconUrl: dto.iconUrl ?? null,
      notesEncrypted: dto.notesEncrypted ?? null,
      strengthScore: dto.strengthScore ?? null,
      isDuplicate: dto.isDuplicate ?? false,
      category: dto.category ?? null,
    });
    return this.repo.save(row);
  }

  findAllForUser(userId: string): Promise<Credential[]> {
    return this.repo.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });
  }

  async findOneForUser(id: string, userId: string): Promise<Credential> {
    const c = await this.repo.findOne({ where: { id, userId } });
    if (!c) {
      throw new NotFoundException('Credential not found');
    }
    return c;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateCredentialDto,
  ): Promise<Credential> {
    const existing = await this.findOneForUser(id, userId);
    Object.assign(existing, dto);
    return this.repo.save(existing);
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.findOneForUser(id, userId);
    await this.repo.remove(existing);
  }
}
