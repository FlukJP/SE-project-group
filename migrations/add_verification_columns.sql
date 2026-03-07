-- Add Is_Email_Verified column to User table
-- Is_Phone_Verified already existed in the schema
-- Required by auth.service.ts and auth.middleware.ts

ALTER TABLE `User`
ADD COLUMN `Is_Email_Verified` TINYINT(1) NOT NULL DEFAULT 0 AFTER `Phone_number`;
