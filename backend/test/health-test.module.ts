import { Module } from '@nestjs/common';
import { AppController } from '../src/app.controller';

/** Minimal app surface for Jest e2e — no DB, no auth (Phase 7 smoke). */
@Module({
  controllers: [AppController],
})
export class HealthTestModule {}
