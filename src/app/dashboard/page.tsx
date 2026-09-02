import { redirect } from "next/navigation";

export const metadata = { robots: { index: false, follow: false } };

export default function DashboardPage() {
  // Fail closed until the approved session adapter is connected.
  redirect("/login");
}
