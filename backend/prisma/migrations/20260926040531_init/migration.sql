-- CreateEnum
CREATE TYPE "transaction_status" AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'VOIDED', 'ERROR');

-- CreateEnum
CREATE TYPE "delivery_status" AS ENUM ('PENDING_PAYMENT', 'ASSIGNED', 'CANCELLED');

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT NOT NULL,
    "price_in_cents" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL,
    "image_url" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "full_name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(64) NOT NULL,
    "status" "transaction_status" NOT NULL DEFAULT 'PENDING',
    "product_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price_in_cents" INTEGER NOT NULL,
    "product_amount_in_cents" INTEGER NOT NULL,
    "base_fee_in_cents" INTEGER NOT NULL,
    "delivery_fee_in_cents" INTEGER NOT NULL,
    "total_in_cents" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "gateway_transaction_id" VARCHAR(64),
    "payment_submitted_at" TIMESTAMPTZ(3),
    "status_message" VARCHAR(255),
    "finalized_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliveries" (
    "id" UUID NOT NULL,
    "transaction_id" UUID NOT NULL,
    "status" "delivery_status" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "recipient_name" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "address_line1" VARCHAR(200) NOT NULL,
    "address_line2" VARCHAR(200),
    "city" VARCHAR(80) NOT NULL,
    "region" VARCHAR(80) NOT NULL,
    "postal_code" VARCHAR(20),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_reference_key" ON "transactions"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_gateway_transaction_id_key" ON "transactions"("gateway_transaction_id");

-- CreateIndex
CREATE INDEX "transactions_product_id_idx" ON "transactions"("product_id");

-- CreateIndex
CREATE INDEX "transactions_customer_id_idx" ON "transactions"("customer_id");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "deliveries_transaction_id_key" ON "deliveries"("transaction_id");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
