import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/"],
      disallow: ["/dashboard", "/admin", "/kasir", "/settings"],
    },
    sitemap: "https://example.com/sitemap.xml",
  };
}
