"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export function LogoutButton({ scope = "current" }: Readonly<{ scope?: "current" | "all" }>) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await fetch(`/api/auth/session${scope === "all" ? "?scope=all" : ""}`, { method: "DELETE" });
    } catch {
      // Session cookie is cleared server-side on success; on failure stay put.
    } finally {
      setLoading(false);
      router.push("/login");
      router.refresh();
    }
  }, [router, scope]);

  return (
    <button type="button" className="button-ghost" onClick={logout} disabled={loading}>
      {loading ? "در حال خروج…" : scope === "all" ? "خروج از همه دستگاه‌ها" : "خروج"}
    </button>
  );
}
