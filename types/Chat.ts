export interface Chat {
    Chat_ID?: number;
    Participant_1: number;
    Participant_2: number;
    Chats_product_ID: number;
    Created_At?: Date;
}

export interface ChatRoomWithPartner extends Chat {
    PartnerName: string;
    ProductTitle?: string;
    ProductImage?: string;
}