/** @type {import('next').NextConfig} */
module.exports = (phase) => {
  const isDev = phase === "phase-development-server";
  return {
    distDir: isDev ? ".next-dev" : ".next",
    output: "standalone",
    reactStrictMode: true,
    experimental: {
      serverComponentsExternalPackages: ["firebase-admin", "jose", "jwks-rsa", "pg"],
    },
  };
};
