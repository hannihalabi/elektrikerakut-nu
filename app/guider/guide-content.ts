import { desc } from "drizzle-orm";
import { getDb } from "../../db";
import { guidePosts as guidePostsTable, type GuidePostRecord } from "../../db/schema";
import { guidePosts as staticGuidePosts, type GuidePost } from "./posts";

function toDateValue(value: string) {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function recordToGuidePost(record: GuidePostRecord): GuidePost {
  return {
    slug: record.slug,
    title: record.title,
    description: record.description,
    category: record.category,
    readTime: record.readTime,
    publishedAt: record.publishedAt.toISOString(),
    updatedLabel: record.updatedLabel,
    accent: record.accent,
    intro: record.intro,
    safetyNote: record.safetyNote,
    sections: record.sections,
    sourceLabel: record.sourceLabel,
    sourceUrl: record.sourceUrl,
  };
}

export async function getGuidePosts() {
  const rows = await getDb().select().from(guidePostsTable).orderBy(desc(guidePostsTable.publishedAt), desc(guidePostsTable.createdAt));
  const postsBySlug = new Map<string, GuidePost>();

  for (const record of rows) postsBySlug.set(record.slug, recordToGuidePost(record));
  for (const post of staticGuidePosts) {
    if (!postsBySlug.has(post.slug)) postsBySlug.set(post.slug, post);
  }

  return [...postsBySlug.values()].sort((left, right) => toDateValue(right.publishedAt) - toDateValue(left.publishedAt));
}

export async function getGuidePostBySlug(slug: string) {
  const posts = await getGuidePosts();
  return posts.find((post) => post.slug === slug);
}
