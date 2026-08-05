import type { NextConfig } from "next";

// Export statico: `next build` genera la cartella `out/` con HTML/CSS/JS puri,
// caricabile su hosting statico (Hostinger public_html). L'app è tutta
// client-side (IndexedDB), quindi non serve Node lato server.
//
// Nota: il service worker Serwist (PWA/offline) non è incluso in questa build
// statica di test; l'app resta pienamente funzionante online. Per riattivare
// l'offline si userà un deploy con Node (`next start`).
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true, // route come cartelle/index.html (comodo su Apache/LiteSpeed)
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
