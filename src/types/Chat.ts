export interface Chat {
    Chat_ID?: number;
    Participant_1: number;
    Participant_2: number;
    Chats_product_ID: number;
    Created_At?: Date;
    Is_Deleted_By_P1?: boolean | number; 
    Is_Deleted_By_P2?: boolean | number;
}

export interface ChatRoomWithPartner extends Chat {
    PartnerName: string;
    ProductTitle?: string;
    ProductImage?: string;
    LastMessage?: string;
    LastMessageTime?: Date | string;
    UnreadCount?: number;
}