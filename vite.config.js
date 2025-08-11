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
            ],
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
                navigateFallback: 'index.html',
                cleanupOutdatedCaches: true,
                runtimeCaching: [
                    {
                        urlPattern: /\.(?:png|webp|jpg|jpeg|svg|gif|ico)$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'images',
                            expiration: {
                                maxEntries: 200,
                                maxAgeSeconds: 60 * 60 * 24 * 30
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*\.css$/, // Font Awesome CSS など
                        handler: 'StaleWhileRevalidate',
                        method: 'GET',
                        options: {
                            cacheName: 'cdn-styles',
                            cacheableResponse: { statuses: [0, 200] }
                        }
                    },
                    {
                        urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*\.(?:woff2?|ttf|otf|eot)$/, // Webフォント
                        handler: 'CacheFirst',
                        method: 'GET',
                        options: {
                            cacheName: 'cdn-fonts',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 * 24 * 365
                            },
                            cacheableResponse: { statuses: [0, 200] }
                        }
                    },
                    {
                        urlPattern: /^https:\/\/shigotoform\.netlify\.app\/img\/.*\.(?:png|webp|jpg|jpeg|svg|gif|ico)$/, // 外部ホスト画像
                        handler: 'CacheFirst',
                        method: 'GET',
                        options: {
                            cacheName: 'remote-images',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 * 24 * 30
                            },
                            cacheableResponse: { statuses: [0, 200] }
                        }
                    }
                ]
            },
            devOptions: {
                enabled: true
            }
        })
    ]
}
