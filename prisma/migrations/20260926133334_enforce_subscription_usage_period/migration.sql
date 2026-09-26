/*
  Warnings:

  - A unique constraint covering the columns `[subscriptionId,periodStart]` on the table `SubscriptionUsage` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "SubscriptionUsage_subscriptionId_periodStart_periodEnd_idx";

-- CreateIndex
CREATE INDEX "SubscriptionUsage_subscriptionId_periodEnd_idx" ON "SubscriptionUsage"("subscriptionId", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionUsage_subscriptionId_periodStart_key" ON "SubscriptionUsage"("subscriptionId", "periodStart");
