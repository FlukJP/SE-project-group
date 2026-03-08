export interface Report {
    Report_ID?: number;
    Reporter_ID: number;
    Reason: string;
    CreatedDate?: Date | string;
    Reported_User_ID?: number | null;
    Reported_Product_ID?: number | null;
}