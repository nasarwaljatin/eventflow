/*
  Warnings:

  - You are about to drop the `refresh_tokens` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_userId_fkey";

-- DropTable
DROP TABLE "refresh_tokens";

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL,
    "registrationId" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "oldStatus" VARCHAR(20),
    "newStatus" VARCHAR(20),
    "note" TEXT,
    "performedById" UUID,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capacity_alerts" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "dismissedById" UUID,
    "dismissedAt" TIMESTAMP(3),
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "capacity_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_log_registrationId_idx" ON "audit_log"("registrationId");

-- CreateIndex
CREATE INDEX "audit_log_performedAt_idx" ON "audit_log"("performedAt");

-- CreateIndex
CREATE UNIQUE INDEX "capacity_alerts_sessionId_key" ON "capacity_alerts"("sessionId");

-- CreateIndex
CREATE INDEX "capacity_alerts_isDismissed_idx" ON "capacity_alerts"("isDismissed");

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capacity_alerts" ADD CONSTRAINT "capacity_alerts_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capacity_alerts" ADD CONSTRAINT "capacity_alerts_dismissedById_fkey" FOREIGN KEY ("dismissedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


CREATE RULE audit_log_no_update AS ON UPDATE TO audit_log DO INSTEAD NOTHING;

CREATE RULE audit_log_no_delete AS ON DELETE TO audit_log DO INSTEAD NOTHING;


