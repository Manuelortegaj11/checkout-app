// Datos iniciales: productos ficticios de la tienda.
// Se ejecuta con `pnpm db:seed` (prisma db seed). Nunca va en una migración.
//
// Es idempotente: crea los productos que faltan y no modifica los existentes,
// así que no pisa el stock de una base de datos en uso. Para volver al estado
// inicial en desarrollo: `pnpm db:reset`.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/infrastructure/persistence/generated/prisma/client';

interface SeedProduct {
  id: string;
  name: string;
  description: string;
  priceInCents: number;
  stock: number;
  imageUrl: string;
}

// Identificadores fijos: el frontend y los tests pueden referenciarlos.
const PRODUCTS: SeedProduct[] = [
  {
    id: '01920000-0000-7000-8000-000000000001',
    name: 'Audífonos inalámbricos',
    description:
      'Cancelación activa de ruido, 30 horas de batería y carga rápida por USB-C.',
    priceInCents: 18_990_000,
    stock: 12,
    imageUrl: '/images/products/wireless-headphones.webp',
  },
  {
    id: '01920000-0000-7000-8000-000000000002',
    name: 'Reloj inteligente',
    description:
      'Pantalla AMOLED, GPS integrado, monitor de ritmo cardíaco y resistencia al agua.',
    priceInCents: 34_990_000,
    stock: 8,
    imageUrl: '/images/products/smartwatch.webp',
  },
  {
    id: '01920000-0000-7000-8000-000000000003',
    name: 'Teclado mecánico',
    description:
      'Interruptores táctiles, retroiluminación RGB y conexión inalámbrica o por cable.',
    priceInCents: 25_990_000,
    stock: 5,
    imageUrl: '/images/products/mechanical-keyboard.webp',
  },
  {
    id: '01920000-0000-7000-8000-000000000004',
    name: 'Mouse ergonómico',
    description:
      'Diseño vertical que reduce la tensión de la muñeca, con sensor de 4000 DPI.',
    priceInCents: 8_990_000,
    stock: 20,
    imageUrl: '/images/products/ergonomic-mouse.webp',
  },
  {
    // Una sola unidad: permite probar el agotamiento tras una compra.
    id: '01920000-0000-7000-8000-000000000005',
    name: 'Parlante Bluetooth portátil',
    description:
      'Sonido 360°, 12 horas de reproducción y resistencia al agua IPX7.',
    priceInCents: 14_990_000,
    stock: 1,
    imageUrl: '/images/products/bluetooth-speaker.webp',
  },
  {
    // Sin stock: permite probar el estado agotado en la interfaz.
    id: '01920000-0000-7000-8000-000000000006',
    name: 'Cámara web 4K',
    description:
      'Resolución 4K a 30 fps, enfoque automático y micrófonos con reducción de ruido.',
    priceInCents: 21_990_000,
    stock: 0,
    imageUrl: '/images/products/webcam-4k.webp',
  },
];

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    for (const product of PRODUCTS) {
      await prisma.product.upsert({
        where: { id: product.id },
        create: product,
        update: {},
      });
    }
    console.log(`Seed: ${PRODUCTS.length} productos listos.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
