export interface Report {
    Report_ID?: number;
    Reporter_ID: number;
    ReporterName?: string;
    Reason: string;
    CreatedDate?: Date | string;
    Reported_User_ID?: number | null;
    Reported_Product_ID?: number | null;
    ReportType?: "user" | "product";
    Target_ID?: number;
    TargetName?: string;
    TargetIsBanned?: boolean | number;
}