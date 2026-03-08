-- Seed: Create admin user with role 'admin', email verified, phone verified
-- Password: Admin@1234 (hashed with bcrypt, 10 rounds)
-- Run: mysql -u root -p database_se_project < migrations/seed_admin_user.sql

INSERT INTO User (Username, Email, Password, Role, Phone_number, Is_Phone_Verified, Is_Email_Verified, Address, Verified_Date, RatingScore, Is_Banned)
VALUES (
    'admin',
    'admin@admin.com',
    '$2b$10$3KItS8/v5EAunP3gneHS4OOU47cDcZU2/F3fyokVPbeSRlWvUBzBS',
    'admin',
    '0999999999',
    1,
    1,
    NULL,
    NOW(),
    0,
    0
);
