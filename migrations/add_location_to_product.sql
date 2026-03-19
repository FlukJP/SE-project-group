-- Migration: Add Location column to Product table
-- Run this on the Aiven cloud database before deploying the updated backend

ALTER TABLE Product
    ADD COLUMN Location VARCHAR(255) NULL AFTER Description;
