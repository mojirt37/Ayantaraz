import { redirect } from "next/navigation";

export const metadata = { robots: { index: false, follow: false } };

export default function AdminPage() {
  // Never expose an administrative surface before server-side session/role verification exists.
  redirect("/login");
}
