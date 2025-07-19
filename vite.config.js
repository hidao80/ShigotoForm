import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

export default {
    plugins: [
        basicSsl(),
        VitePWA({
            registerType: 'autoUpdate',
            manifest: {
                name: 'ShigotoForm',
                short_name: 'ShigotoForm',
                description: 'ShigotoForm is a project designed to streamline and simplify job application processes.',
                theme_color: '#ffffff',
                icons: [
                    {
                        src: 'public/img/favicon512.webp',
                        sizes: '512x512',
                        type: 'image/webp'
                    },
                    {
                        src: 'public/img/favicon256.webp',
                        sizes: '256x256',
                        type: 'image/webp'
                    },
                    {
                        src: 'public/img/favicon72.webp',
                        sizes: '72x72',
                        type: 'image/webp'
                    },
                    {
                        src: 'public/img/favicon32.webp',
                        sizes: '32x32',
                        type: 'image/webp'
                    }
                ]
            }
        })
    ]
}
