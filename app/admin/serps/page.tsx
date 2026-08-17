import { requirePartnerAdmin } from "../../partner-admin-auth";
import { SerpsAdmin } from "./serps-admin";

export default async function SerpsPage() {
  await requirePartnerAdmin();
  return <SerpsAdmin />;
}
