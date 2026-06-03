-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'Personal',
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'Medium',
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Assign unique sortOrder to existing rows based on creation order
WITH ranked AS (
  SELECT id, (ROW_NUMBER() OVER (ORDER BY "createdAt" ASC))::int - 1 AS new_order
  FROM "Task"
)
UPDATE "Task"
SET "sortOrder" = ranked.new_order
FROM ranked
WHERE "Task".id = ranked.id;
