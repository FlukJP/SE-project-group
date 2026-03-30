import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        setupFiles: ['./src/tests/setupEnv.ts'],
    },
    resolve: {
        alias: {
            '@': path.resolve(process.cwd(), '.'),
        },
    },
});
