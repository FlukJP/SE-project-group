-- สร้างตาราง Category
CREATE TABLE IF NOT EXISTS Category (
    Category_ID INT AUTO_INCREMENT PRIMARY KEY,
    category_key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed ข้อมูลหมวดหมู่เริ่มต้น
INSERT INTO Category (category_key, name, emoji, sort_order) VALUES
    ('cars',       'รถยนต์',          '🚗', 1),
    ('phones',     'มือถือ',          '📱', 2),
    ('property',   'บ้าน & ที่ดิน',   '🏡', 3),
    ('fashion',    'แฟชั่น',          '👗', 4),
    ('jobs',       'งาน',             '💼', 5),
    ('computers',  'คอมพิวเตอร์',     '💻', 6),
    ('appliances', 'เครื่องใช้ไฟฟ้า', '🔌', 7),
    ('sports',     'กีฬา',            '🏀', 8),
    ('pets',       'สัตว์เลี้ยง',     '🐾', 9),
    ('others',     'อื่น ๆ',          '🧩', 10)
ON DUPLICATE KEY UPDATE name = VALUES(name);
