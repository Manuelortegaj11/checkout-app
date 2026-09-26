import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import type { EnvironmentVariables } from '@config/env.validation';
import { PrismaClient } from './generated/prisma/client';

/**
 * Cliente de Prisma compartido por todos los repositorios.
 * Solo la capa de infraestructura lo conoce: el dominio y la aplicación
 * acceden a los datos a través de sus ports.
 *
 * La conexión se abre en la primera consulta y se cierra al apagar la API.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(config: ConfigService<EnvironmentVariables, true>) {
    super({
      adapter: new PrismaPg({
        connectionString: config.get('DATABASE_URL', { infer: true }),
      }),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
