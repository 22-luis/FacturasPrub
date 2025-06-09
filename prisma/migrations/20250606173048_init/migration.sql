-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('REPARTIDOR', 'SUPERVISOR', 'ADMINISTRADOR');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDIENTE', 'ENTREGADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "supplierName" TEXT NOT NULL,
    "uniqueCode" TEXT NOT NULL,
    "address" TEXT,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDIENTE',
    "cancellationReason" TEXT,
    "assigneeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_uniqueCode_key" ON "Invoice"("uniqueCode");

-- CreateIndex
CREATE INDEX "Invoice_assigneeId_idx" ON "Invoice"("assigneeId");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
