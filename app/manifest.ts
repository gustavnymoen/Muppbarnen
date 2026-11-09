import type { MetadataRoute } from "next";
import { SITE_NAME } from "./components/SiteHeader";

// Namnet och ikonerna när sajten läggs på en telefons hemskärm (MUPP-046-R2). Färgen är --color-page.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    lang: "sv",
    start_url: "/",
    display: "standalone",
    background_color: "#0C1015",
    theme_color: "#0C1015",
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
