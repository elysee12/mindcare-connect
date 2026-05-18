-- AlterTable
ALTER TABLE `patient` ADD COLUMN `foundByUserId` INTEGER NULL,
    ADD COLUMN `foundDetails` VARCHAR(191) NULL,
    ADD COLUMN `locationFound` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Patient` ADD CONSTRAINT `Patient_foundByUserId_fkey` FOREIGN KEY (`foundByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
