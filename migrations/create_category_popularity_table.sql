-- ตาราง CategoryPopularity: บันทึก event การค้นหา/ซื้อแต่ละหมวดหมู่
CREATE TABLE IF NOT EXISTS CategoryPopularity (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_key VARCHAR(50) NOT NULL,
    event_type ENUM('search', 'purchase') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category_key (category_key),
    INDEX idx_created_at (created_at),
    INDEX idx_category_event (category_key, event_type, created_at)
);
