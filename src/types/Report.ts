export interface Report {
    Report_ID?: number;
    Reporter_ID: number;
    Target_ID: number;
    ReportType: 'product' | 'user';
    Reason: string;
    CreatedDate?: Date;
}