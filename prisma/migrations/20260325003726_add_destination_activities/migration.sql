-- CreateEnum
CREATE TYPE "ActivityCategory" AS ENUM ('CULTURE', 'FOOD', 'NATURE', 'NIGHTLIFE', 'SHOPPING', 'OTHER');

-- CreateTable
CREATE TABLE "DestinationActivity" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ActivityCategory" NOT NULL,
    "notes" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DestinationActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DestinationActivity_destinationId_idx" ON "DestinationActivity"("destinationId");

-- AddForeignKey
ALTER TABLE "DestinationActivity" ADD CONSTRAINT "DestinationActivity_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;
