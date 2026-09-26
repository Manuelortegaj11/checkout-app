import { BadRequestException, type ArgumentMetadata } from '@nestjs/common';
import { parseUuid } from './parse-uuid.pipe';

describe('parseUuid', () => {
  const metadata: ArgumentMetadata = { type: 'param', data: 'id' };
  const pipe = parseUuid('id');

  it('deja pasar un UUID válido', async () => {
    const id = '01920000-0000-7000-8000-000000000001';

    await expect(pipe.transform(id, metadata)).resolves.toBe(id);
  });

  it.each(['abc', '123', '01920000-0000-7000-8000'])(
    'rechaza %p con INVALID_REQUEST y el campo afectado',
    async (value) => {
      const promise = pipe.transform(value, metadata);

      await expect(promise).rejects.toBeInstanceOf(BadRequestException);
      await expect(promise).rejects.toMatchObject({
        response: {
          code: 'INVALID_REQUEST',
          message: 'Request validation failed',
          details: [{ field: 'id', message: 'id must be a UUID' }],
        },
      });
    },
  );
});
