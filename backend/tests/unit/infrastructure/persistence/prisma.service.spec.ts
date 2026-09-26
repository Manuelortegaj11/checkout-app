import type { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '@config/env.validation';
import { PrismaService } from '@infrastructure/persistence/prisma.service';

const DATABASE_URL =
  'postgresql://checkout:checkout@localhost:5433/checkout?schema=public';

const configWith = (values: Partial<EnvironmentVariables>) =>
  ({
    get: jest.fn((key: keyof EnvironmentVariables) => values[key]),
  }) as unknown as ConfigService<EnvironmentVariables, true> & {
    get: jest.Mock;
  };

describe('PrismaService', () => {
  it('se configura con DATABASE_URL sin abrir conexión al crearse', () => {
    const config = configWith({ DATABASE_URL });

    const prisma = new PrismaService(config);

    // PrismaClient devuelve un Proxy, así que se comprueba que exponga los modelos.
    expect(prisma.product).toBeDefined();
    expect(prisma.transaction).toBeDefined();
    expect(config.get).toHaveBeenCalledWith('DATABASE_URL', { infer: true });
  });

  it('cierra la conexión al apagar la aplicación', async () => {
    const prisma = new PrismaService(configWith({ DATABASE_URL }));
    const disconnect = jest
      .spyOn(prisma, '$disconnect')
      .mockResolvedValue(undefined);

    await prisma.onModuleDestroy();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
