-- Migration: Add missing unique constraints
-- Run this after all previous migrations have been applied.

-- 1. User.Email must be unique (currently only enforced at app level)
ALTER TABLE User
  ADD UNIQUE INDEX uq_user_email (Email);

-- 2. User.Phone_number must be unique (currently only enforced at app level)
ALTER TABLE User
  ADD UNIQUE INDEX uq_user_phone (Phone_number);

-- 3. Prevent duplicate chat rooms for the same pair + product
--    (Participant_1, Participant_2, Chats_product_ID) must be unique
ALTER TABLE Chat
  ADD UNIQUE INDEX uq_chat_participants_product (Participant_1, Participant_2, Chats_product_ID);

-- 4. Prevent the same user from reporting the same target+type more than once
ALTER TABLE Report
  ADD UNIQUE INDEX uq_report_unique (Reporter_ID, Target_ID, ReportType);

-- 5. Index on CategoryPopularity.category_key for faster aggregation queries
ALTER TABLE CategoryPopularity
  ADD INDEX idx_catpop_key_created (category_key, created_at);
