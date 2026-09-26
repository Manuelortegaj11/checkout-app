import { Global, Module } from '@nestjs/common';
import { PrismaService } from '@infrastructure/persistence/prisma.service';

/**
 * Global: cualquier `<feature>.repositories.module.ts` puede inyectar
 * PrismaService sin volver a registrarlo.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PersistenceModule {}
