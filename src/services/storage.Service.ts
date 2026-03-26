import admin from '../config/firebaseAdmin';

const MIME_TO_EXT: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
};

export const generateUniqueFilename = (prefix: string, mimetype: string): string => {
    const ext = MIME_TO_EXT[mimetype] ?? '.jpg';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    return `${prefix}-${uniqueSuffix}${ext}`;
};

/** Upload a file buffer to Firebase Storage and return its public URL */
export const uploadToStorage = async (
    buffer: Buffer,
    mimetype: string,
    folder: 'products' | 'users',
    filename: string,
): Promise<string> => {
    const bucket = admin.storage().bucket();
    const destination = `uploads/${folder}/${filename}`;
    const file = bucket.file(destination);

    await file.save(buffer, { metadata: { contentType: mimetype } });
    await file.makePublic();

    return `https://storage.googleapis.com/${bucket.name}/${destination}`;
};

/** Delete a file from Firebase Storage by its public URL (silently skips on error) */
export const deleteFromStorage = async (url: string): Promise<void> => {
    try {
        const bucket = admin.storage().bucket();
        const prefix = `https://storage.googleapis.com/${bucket.name}/`;
        if (!url.startsWith(prefix)) return;
        const filePath = url.slice(prefix.length);
        await bucket.file(filePath).delete();
    } catch {
        // Ignore — file may already be gone
    }
};

/** Delete all files referenced in a JSON array of URLs (or a single URL string) */
export const deleteStorageImages = async (imageUrlJson: string): Promise<void> => {
    try {
        const urls: string[] = JSON.parse(imageUrlJson);
        await Promise.all(urls.map(deleteFromStorage));
    } catch {
        await deleteFromStorage(imageUrlJson);
    }
};
