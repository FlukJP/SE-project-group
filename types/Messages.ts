export interface Message {
    Messages_ID?: number;
    Chat_ID: number;
    Sender_ID: number;
    Content: string;
    MessagesType: 'text' | 'image';
    Is_Read?: boolean;
    Timestamp?: Date;
}

export interface MessageWithSender extends Message {
    SenderName: string;
}