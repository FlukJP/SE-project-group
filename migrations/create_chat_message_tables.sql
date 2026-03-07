-- Chat table
CREATE TABLE IF NOT EXISTS `Chat` (
    `Chat_ID` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `Participant_1` INT UNSIGNED NOT NULL,
    `Participant_2` INT UNSIGNED NOT NULL,
    `Chats_product_ID` INT UNSIGNED NOT NULL,
    `Created_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `Timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `Is_Deleted_By_P1` TINYINT(1) NOT NULL DEFAULT 0,
    `Is_Deleted_By_P2` TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (`Chat_ID`),
    KEY `idx_chat_p1` (`Participant_1`),
    KEY `idx_chat_p2` (`Participant_2`),
    CONSTRAINT `fk_chat_p1` FOREIGN KEY (`Participant_1`) REFERENCES `User` (`User_ID`) ON DELETE CASCADE,
    CONSTRAINT `fk_chat_p2` FOREIGN KEY (`Participant_2`) REFERENCES `User` (`User_ID`) ON DELETE CASCADE,
    CONSTRAINT `fk_chat_product` FOREIGN KEY (`Chats_product_ID`) REFERENCES `Product` (`Product_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Message table
CREATE TABLE IF NOT EXISTS `Message` (
    `Messages_ID` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `Chat_ID` INT UNSIGNED NOT NULL,
    `Sender_ID` INT UNSIGNED NOT NULL,
    `Content` TEXT NOT NULL,
    `MessagesType` ENUM('text','image') NOT NULL DEFAULT 'text',
    `Is_Read` TINYINT(1) NOT NULL DEFAULT 0,
    `Timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`Messages_ID`),
    KEY `idx_msg_chat` (`Chat_ID`),
    KEY `idx_msg_sender` (`Sender_ID`),
    CONSTRAINT `fk_msg_chat` FOREIGN KEY (`Chat_ID`) REFERENCES `Chat` (`Chat_ID`) ON DELETE CASCADE,
    CONSTRAINT `fk_msg_sender` FOREIGN KEY (`Sender_ID`) REFERENCES `User` (`User_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
