ALTER TABLE "Quiz" ADD COLUMN "accessCode" TEXT;

UPDATE "Quiz"
SET "accessCode" = 'QUIZ-' || "id"
WHERE "status" = 'PUBLISHED' AND "accessCode" IS NULL;

CREATE UNIQUE INDEX "Quiz_accessCode_key" ON "Quiz"("accessCode");
