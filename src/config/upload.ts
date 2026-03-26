import multer from 'multer';
import { UPLOAD_CONFIG } from './constants';

const memoryStorage = multer.memoryStorage();
const createMulterLimits = (maxSize: number) => ({ fileSize: maxSize });

export const MULTER_CONFIG = {
    product: {
        storage: memoryStorage,
        limits: createMulterLimits(UPLOAD_CONFIG.PRODUCT.MAX_SIZE),
    },
    user: {
        storage: memoryStorage,
        limits: createMulterLimits(UPLOAD_CONFIG.USER.MAX_SIZE),
    },
} as const;
