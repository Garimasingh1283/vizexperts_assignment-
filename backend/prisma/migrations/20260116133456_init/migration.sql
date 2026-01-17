-- CreateTable
CREATE TABLE `Upload` (
    `id` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `total_size` BIGINT NOT NULL,
    `total_chunks` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `final_hash` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Chunk` (
    `upload_id` VARCHAR(191) NOT NULL,
    `chunk_index` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `received_at` DATETIME(3) NULL,

    PRIMARY KEY (`upload_id`, `chunk_index`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Chunk` ADD CONSTRAINT `Chunk_upload_id_fkey` FOREIGN KEY (`upload_id`) REFERENCES `Upload`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
