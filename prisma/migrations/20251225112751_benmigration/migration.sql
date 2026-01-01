/*
  Warnings:

  - You are about to drop the column `phone` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[clientId,productId,sourceId]` on the table `Entitlement` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `toAddress` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Appointment_orderId_key";

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "isRescheduled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "providerMessageId" TEXT,
ADD COLUMN     "toAddress" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "phone",
ADD COLUMN     "phoneE164" VARCHAR(20),
ADD COLUMN     "phoneVerifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" UUID NOT NULL,
    "coachId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "mediaUrl" TEXT,
    "mediaType" TEXT,
    "publishedAt" TIMESTAMP(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachAvailability" (
    "id" UUID NOT NULL,
    "coachId" UUID NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentItem_coachId_idx" ON "ContentItem"("coachId");

-- CreateIndex
CREATE INDEX "ContentItem_productId_idx" ON "ContentItem"("productId");

-- CreateIndex
CREATE INDEX "ContentItem_publishedAt_idx" ON "ContentItem"("publishedAt");

-- CreateIndex
CREATE INDEX "ContentItem_isPublished_idx" ON "ContentItem"("isPublished");

-- CreateIndex
CREATE INDEX "CoachAvailability_coachId_idx" ON "CoachAvailability"("coachId");

-- CreateIndex
CREATE INDEX "CoachAvailability_dayOfWeek_idx" ON "CoachAvailability"("dayOfWeek");

-- CreateIndex
CREATE INDEX "CoachAvailability_isActive_idx" ON "CoachAvailability"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Entitlement_clientId_productId_sourceId_key" ON "Entitlement"("clientId", "productId", "sourceId");

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachAvailability" ADD CONSTRAINT "CoachAvailability_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE CASCADE ON UPDATE CASCADE;
