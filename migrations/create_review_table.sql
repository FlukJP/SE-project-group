-- ตาราง Review: รีวิวและให้คะแนนผู้ขาย
CREATE TABLE IF NOT EXISTS Review (
    Review_ID INT AUTO_INCREMENT PRIMARY KEY,
    Order_ID INT UNSIGNED NOT NULL,
    Reviewer_ID INT UNSIGNED NOT NULL,
    Seller_ID INT UNSIGNED NOT NULL,
    Rating TINYINT NOT NULL CHECK (Rating >= 1 AND Rating <= 5),
    Comment TEXT,
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_order_review (Order_ID),
    FOREIGN KEY (Order_ID) REFERENCES `Order`(Order_ID),
    FOREIGN KEY (Reviewer_ID) REFERENCES User(User_ID),
    FOREIGN KEY (Seller_ID) REFERENCES User(User_ID),
    INDEX idx_seller (Seller_ID),
    INDEX idx_reviewer (Reviewer_ID)
);
