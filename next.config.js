/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                // You can add these as well
                // port: '',
                // pathname: 'arifscloud/image/upload/**',
            },
        ],
    },
    env: {
        MAPTILER_API: process.env.MAPTILER_API
    }
}

module.exports = nextConfig
