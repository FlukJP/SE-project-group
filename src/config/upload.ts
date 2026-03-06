import multer from 'multer';
import path from 'path';
import { UPLOAD_CONFIG } from './constants';
import mime from 'mime-types';

export const multerProductStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_CONFIG.UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        let ext = '';
        if (file.mimetype === 'image/jpeg') ext = '.jpg';
        else if (file.mimetype === 'image/png') ext = '.png';
        else if (file.mimetype === 'image/webp') ext = '.webp';
        else if (file.mimetype === 'image/gif') ext = '.gif';
        else ext = path.extname(file.originalname).toLowerCase();
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `product-${uniqueSuffix}${ext}`);
    }
});

export const multerProductLimits = {
    fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
};