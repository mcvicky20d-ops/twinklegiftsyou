-- CreateEnum
CREATE TYPE "CustomisationMode" AS ENUM ('NONE', 'TEXT_ONLY', 'IMAGE_ONLY', 'TEXT_AND_IMAGE');

-- CreateEnum
CREATE TYPE "ImageDelivery" AS ENUM ('NOT_NEEDED', 'UPLOADED', 'WHATSAPP', 'CONTACT_ME');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "contactConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "imageDelivery" "ImageDelivery" NOT NULL DEFAULT 'NOT_NEEDED';

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "customisationMode" "CustomisationMode" NOT NULL DEFAULT 'NONE';
