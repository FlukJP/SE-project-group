export interface Message {
    MessagesID?: number;
    Chat_ID: number;
    Sender_ID: number;
    Content: string;
    MessagesType: 'text' | 'image';
    Is_Read?: boolean;
    Timestamp?: Date;
}