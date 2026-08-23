import type { MetadataRoute } from "next";
import { serviceAreas } from "./eljour/areas";
import { getGuidePosts } from "./guider/guide-content";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const guidePosts = await getGuidePosts();
  const localPagesUpdatedAt = new Date("2026-08-13T00:00:00.000Z");
  const latestGuideDate = guidePosts.reduce((latest, post) => {
    const postDate = new Date(post.publishedAt);
    return postDate.getTime() > latest.getTime() ? postDate : latest;
  }, new Date(guidePosts[0]?.publishedAt ?? "2026-08-17T00:00:00.000Z"));
  return [
    { url: "https://elektrikerakut.nu", changeFrequency: "weekly", priority: 1 },
    { url: "https://elektrikerakut.nu/eljour", changeFrequency: "weekly", priority: 0.9 },
    { url: "https://elektrikerakut.nu/trygghet", changeFrequency: "monthly", priority: 0.6 },
    { url: "https://elektrikerakut.nu/bli-partner", changeFrequency: "monthly", priority: 0.5 },
    { url: "https://elektrikerakut.nu/guider", changeFrequency: "weekly", priority: 0.7, lastModified: latestGuideDate },
    ...guidePosts.map((post) => ({ url: `https://elektrikerakut.nu/guider/${post.slug}`, lastModified: new Date(post.publishedAt), changeFrequency: "monthly" as const, priority: 0.6 })),
    ...serviceAreas.map((area) => ({ url: `https://elektrikerakut.nu/eljour/${area.slug}`, lastModified: localPagesUpdatedAt, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
