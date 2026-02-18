export interface Report {
    ReportID?: number;
    ReporterID: number;
    TargetID: number;
    ReportType: 'product' | 'user';
    Reason: string;
    CreatedDate?: Date;
}