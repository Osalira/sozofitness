/*
  Warnings:

  - The values [sms] on the enum `NotificationChannel` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `phoneE164` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phoneVerifiedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `smsOptIn` on the `User` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationChannel_new" AS ENUM ('email');
ALTER TABLE "Notification" ALTER COLUMN "channel" TYPE "NotificationChannel_new" USING ("channel"::text::"NotificationChannel_new");
ALTER TYPE "NotificationChannel" RENAME TO "NotificationChannel_old";
ALTER TYPE "NotificationChannel_new" RENAME TO "NotificationChannel";
DROP TYPE "public"."NotificationChannel_old";
COMMIT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "phoneE164",
DROP COLUMN "phoneVerifiedAt",
DROP COLUMN "smsOptIn";
