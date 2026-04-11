-- AlterTable
ALTER TABLE "media_assets" ADD COLUMN     "analysis_error" TEXT,
ADD COLUMN     "analysis_status" TEXT NOT NULL DEFAULT 'none';

-- CreateTable
CREATE TABLE "shots" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "start_ms" INTEGER NOT NULL,
    "end_ms" INTEGER NOT NULL,
    "index" INTEGER NOT NULL,
    "thumbnail_key" TEXT,

    CONSTRAINT "shots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transcript_segments" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "start_ms" INTEGER NOT NULL,
    "end_ms" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "index" INTEGER NOT NULL,

    CONSTRAINT "transcript_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "face_detections" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "start_ms" INTEGER NOT NULL,
    "end_ms" INTEGER NOT NULL,
    "face_count" INTEGER NOT NULL DEFAULT 1,
    "bbox_x" DOUBLE PRECISION NOT NULL,
    "bbox_y" DOUBLE PRECISION NOT NULL,
    "bbox_w" DOUBLE PRECISION NOT NULL,
    "bbox_h" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "face_detections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shots_asset_id_idx" ON "shots"("asset_id");

-- CreateIndex
CREATE INDEX "transcript_segments_asset_id_idx" ON "transcript_segments"("asset_id");

-- CreateIndex
CREATE INDEX "face_detections_asset_id_idx" ON "face_detections"("asset_id");

-- AddForeignKey
ALTER TABLE "shots" ADD CONSTRAINT "shots_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transcript_segments" ADD CONSTRAINT "transcript_segments_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "face_detections" ADD CONSTRAINT "face_detections_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
