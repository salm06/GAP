import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GAP Player",
    short_name: "GAP",
    description: "Conduci le attività didattiche GAP dal telefono.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ECECE7",
    theme_color: "#ECECE7",
    icons: [
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
