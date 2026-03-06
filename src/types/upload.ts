export interface IUploadedFile {
    filename: string;
    mimetype: string;
    size: number;
    path: string;
}

export interface IUploadResponse {
    success: boolean;
    file?: IUploadedFile;
    message?: string;
}

export enum UploadFolderType {
    PRODUCT = 'product',
    USER = 'user', 
}