-- AlterTable
ALTER TABLE "media_assets" ADD COLUMN     "folder_id" TEXT;

-- CreateTable
CREATE TABLE "media_folders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_tags" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_asset_tags" (
    "asset_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "media_asset_tags_pkey" PRIMARY KEY ("asset_id","tag_id")
);

-- CreateIndex
CREATE INDEX "media_folders_user_id_parent_id_idx" ON "media_folders"("user_id", "parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "media_tags_user_id_name_key" ON "media_tags"("user_id", "name");

-- CreateIndex
CREATE INDEX "media_assets_folder_id_idx" ON "media_assets"("folder_id");

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "media_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_folders" ADD CONSTRAINT "media_folders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_folders" ADD CONSTRAINT "media_folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "media_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_tags" ADD CONSTRAINT "media_tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_asset_tags" ADD CONSTRAINT "media_asset_tags_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_asset_tags" ADD CONSTRAINT "media_asset_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "media_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
