-- CreateTable
CREATE TABLE "voiceovers" (
    "id" TEXT NOT NULL,
    "script_id" TEXT NOT NULL,
    "voice_id" TEXT NOT NULL,
    "minimax_task_id" TEXT,
    "minimax_file_id" TEXT,
    "audio_url" TEXT,
    "audio_expires_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "character_count" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voiceovers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "voiceovers_script_id_idx" ON "voiceovers"("script_id");

-- AddForeignKey
ALTER TABLE "voiceovers" ADD CONSTRAINT "voiceovers_script_id_fkey" FOREIGN KEY ("script_id") REFERENCES "scripts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voiceovers" ADD CONSTRAINT "voiceovers_voice_id_fkey" FOREIGN KEY ("voice_id") REFERENCES "voices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
