import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

export default {
    plugins: [
        basicSsl(),
        VitePWA({
            registerType: 'autoUpdate',
            // 静的 public/manifest.json を使用するため、ここではmanifestを定義しない
            includeAssets: [
                'img/favicon32.webp',
                'img/favicon32.png',
                'img/favicon48.webp',
                'img/favicon64.webp',
                'img/favicon72.webp',
                'img/favicon128.webp',
                'img/favicon256.webp',
                'img/favicon512.webp'
            ]
        })
    ]
}
