ALTER TABLE "projects"
  ADD COLUMN IF NOT EXISTS "projectName" varchar,
  ADD COLUMN IF NOT EXISTS "theme" varchar,
  ADD COLUMN IF NOT EXISTS "projectVisualDescription" text;
