import { expect, test } from "@playwright/test";

test("serves the public health endpoint with no-store caching and request correlation", async ({
  request
}) => {
  const response = await request.get("/api/health");

  expect(response.ok()).toBe(true);
  expect(await response.json()).toEqual({ status: "ok" });
  expect(response.headers()["cache-control"]).toBe("no-store");
  expect(response.headers()["x-request-id"]).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  );
});

test("keeps private dashboard unavailable without an authenticated server session", async ({
  page
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "ورود با شماره همراه" })).toBeVisible();
});

test("explains unavailable tax rules without presenting a calculation result", async ({
  request
}) => {
  const response = await request.get("/tax-calculator");
  expect(response.ok()).toBe(true);
  const body = await response.text();
  expect(body).toContain("قانون قابل محاسبه هنوز منتشر نشده است");
  expect(body).toContain("هیچ عددی محاسبه یا نمایش داده نمی‌شود");
});
