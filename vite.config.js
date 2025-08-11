import { defineConfig } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ command }) => ({
    plugins: [
        ...(command === 'serve' ? [basicSsl()] : []),
        VitePWA({
            // workbox-window を使うため自動登録は行わない
            injectRegister: false,
            // VitePWA が生成する manifest.webmanifest を優先
            useCredentials: true,
            manifest: {
                name: 'ShigotoForm',
                short_name: 'ShigotoForm',
                description: '履歴書を簡単に作成できるWebアプリ ShigotoForm',
                id: '/',
                start_url: '/',
                scope: '/',
                display: 'standalone',
                orientation: 'portrait-primary',
                lang: 'ja',
                dir: 'ltr',
                theme_color: '#ffffff',
                background_color: '#ffffff',
                categories: ['productivity', 'business'],
                icons: [
                    { src: '/img/favicon512.webp', sizes: '512x512', type: 'image/webp', purpose: 'any' },
                    { src: '/img/favicon256.webp', sizes: '256x256', type: 'image/webp', purpose: 'any' },
                    { src: '/img/favicon128.webp', sizes: '128x128', type: 'image/webp', purpose: 'any' },
                    { src: '/img/favicon72.webp',  sizes: '72x72',  type: 'image/webp', purpose: 'any' },
                    { src: '/img/favicon64.webp',  sizes: '64x64',  type: 'image/webp', purpose: 'any' },
                    { src: '/img/favicon48.webp',  sizes: '48x48',  type: 'image/webp', purpose: 'any' },
                    { src: '/img/favicon32.webp',  sizes: '32x32',  type: 'image/webp', purpose: 'any' },
                    { src: '/img/favicon32.png',   sizes: '32x32',  type: 'image/png',  purpose: 'any' }
                ]
            },
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
                // Android Edge でのオフライン遷移安定化: index.html を確実に precache
                additionalManifestEntries: [
                    { url: '/index.html', revision: null }
                ],
                navigateFallback: '/index.html',
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
                // HTTPS dev + SWテスト用に開発時も有効化
                enabled: command === 'serve',
                // workbox-windowのコンストラクタに合わせ module 型にする
                type: 'module'
            }
        })
    ]
}))
