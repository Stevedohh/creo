-- AlterTable
ALTER TABLE "voiceovers" ADD COLUMN     "storage_bytes" INTEGER,
ADD COLUMN     "storage_key" TEXT,
ADD COLUMN     "storage_uploaded_at" TIMESTAMP(3),
ADD COLUMN     "subtitles_key" TEXT;
