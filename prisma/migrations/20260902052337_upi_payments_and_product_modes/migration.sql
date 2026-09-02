-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('RAZORPAY', 'UPI', 'PENDING');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "upiReference" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "customisationModes" "CustomisationMode"[] DEFAULT ARRAY['TEXT_ONLY', 'IMAGE_ONLY', 'TEXT_AND_IMAGE']::"CustomisationMode"[];
