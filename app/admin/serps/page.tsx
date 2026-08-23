import { requirePartnerAdmin } from "../../partner-admin-auth";
import { getGuidePosts } from "../../guider/guide-content";
import { SerpsAdmin } from "./serps-admin";

export const dynamic = "force-dynamic";

export default async function SerpsPage() {
  await requirePartnerAdmin();
  const posts = await getGuidePosts();
  return <SerpsAdmin posts={posts} />;
}
