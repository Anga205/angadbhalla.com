// @ts-check
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

import solidJs from '@astrojs/solid-js';

// https://astro.build/config
export default defineConfig({
    vite: {
        resolve: {
            alias: {
                '@': new URL('./src', import.meta.url).pathname
            }
        },
        plugins: [
            tailwindcss()
        ]
    },
    integrations: [solidJs()]
});