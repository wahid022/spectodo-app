-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "notificationTriggered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reminderEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reminderStatus" TEXT NOT NULL DEFAULT 'none',
ADD COLUMN     "reminderTime" TIMESTAMP(3),
ADD COLUMN     "snoozeUntil" TIMESTAMP(3);
