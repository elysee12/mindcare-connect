-- AlterTable
ALTER TABLE `notification` ADD COLUMN `metadata` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `reminder` ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING';
