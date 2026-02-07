-- type "public.HomeworkType" does not exist hatasını giderir.
-- Bir kez çalıştırın: DATABASE_URL="..." npx prisma db execute --file prisma/patch-homework-type-enum.sql

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'HomeworkType') THEN
    CREATE TYPE "HomeworkType" AS ENUM ('TEXT', 'FILE', 'AUDIO', 'MIXED');
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'homeworks' AND column_name = 'type')
     AND (SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'homeworks' AND column_name = 'type') = 'text' THEN
    ALTER TABLE "homeworks" ALTER COLUMN "type" DROP DEFAULT;
    ALTER TABLE "homeworks" ALTER COLUMN "type" TYPE "HomeworkType" USING "type"::"HomeworkType";
    ALTER TABLE "homeworks" ALTER COLUMN "type" SET DEFAULT 'TEXT'::"HomeworkType";
  END IF;
END $$;
