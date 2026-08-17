import type { MetadataRoute } from "next";
import { serviceAreas } from "./eljour/areas";
import { guidePosts } from "./guider/posts";

export default function sitemap(): MetadataRoute.Sitemap {
  const localPagesUpdatedAt = new Date("2026-08-13T00:00:00.000Z");
  const latestGuideDate = guidePosts.reduce((latest, post) => post.publishedAt > latest ? post.publishedAt : latest, guidePosts[0]?.publishedAt ?? "2026-08-17");
  return [
    { url: "https://elektrikerakut.nu", changeFrequency: "weekly", priority: 1 },
    { url: "https://elektrikerakut.nu/eljour", changeFrequency: "weekly", priority: 0.9 },
    { url: "https://elektrikerakut.nu/trygghet", changeFrequency: "monthly", priority: 0.6 },
    { url: "https://elektrikerakut.nu/bli-partner", changeFrequency: "monthly", priority: 0.5 },
    { url: "https://elektrikerakut.nu/guider", changeFrequency: "weekly", priority: 0.7, lastModified: new Date(`${latestGuideDate}T00:00:00.000Z`) },
    ...guidePosts.map((post) => ({ url: `https://elektrikerakut.nu/guider/${post.slug}`, lastModified: new Date(`${post.publishedAt}T00:00:00.000Z`), changeFrequency: "monthly" as const, priority: 0.6 })),
    ...serviceAreas.map((area) => ({ url: `https://elektrikerakut.nu/eljour/${area.slug}`, lastModified: localPagesUpdatedAt, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
