import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/errors/AppError';
import { MAX_FILE_SIZE } from '@/config/constants';
import fsPromises from 'fs/promises';

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads');

const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp'
];

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

let fileTypeFromFile: typeof import('file-type').fileTypeFromFile;

const getFileTypeLoader = async () => {
    if (!fileTypeFromFile) {
        const module = await import('file-type');
        fileTypeFromFile = module.fileTypeFromFile;
    }
    return fileTypeFromFile;
};

// Set file saving settings.
const storage = multer.diskStorage({
    destination: (req: Request, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req: Request, file, cb) => {
        const uniqueName = crypto.randomBytes(8).toString('hex') + '-' + Date.now();
        cb(null, `tmp-${uniqueName}`);
    }
});

const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new AppError('Invalid file type. Only JPEG, PNG, WEBP allowed.', 400));
    }
    cb(null, true);
};

export const uploadImage = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter
});

// Middleware detects Magic Bytes.
export const validateUploadedImage = async (req: Request, res: Response, next: NextFunction) => {
    const files = req.file ? [req.file] : (req.files as Express.Multer.File[]) || [];
    if (files.length === 0) return next();
    try {
        const checkFileType = await getFileTypeLoader();

        for (const file of files) {
            const oldFilePath = file.path;
            const meta = await checkFileType(oldFilePath);

            if (!meta || !ALLOWED_MIME_TYPES.includes(meta.mime)) {
                await fsPromises.unlink(oldFilePath);
                throw new AppError('Invalid image file. File signature does not match or is unsupported.', 400);
            }
            const finalFilename = file.filename.replace('tmp-', 'image-') + `.${meta.ext}`;
            const newFilePath = path.join(UPLOAD_DIR, finalFilename);
            
            await fsPromises.rename(oldFilePath, newFilePath);
            file.path = newFilePath;
            file.filename = finalFilename;
            file.mimetype = meta.mime;
        }
        next();
    } 
    catch (err) {
        await Promise.all(
            files.map(async (file) => {
                try {
                    await fsPromises.unlink(file.path);
                } catch (cleanupErr) {
                    console.error('Error occurred while cleaning up file:', cleanupErr);
                }
            })
        );
        next(err);
    }
};