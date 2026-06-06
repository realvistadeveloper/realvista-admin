// app/(dashboard)/payments/page.tsx
import { requireAccessLevel } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import PaymentsClient from "./payments-client";
import type { PaymentStats, PaginatedPayments } from "./types";

export default async function PaymentsPage() {
  const session = await requireAccessLevel(5);
  const t = session.accessToken;

  const [stats, payments] = await Promise.all([
    apiFetch<PaymentStats>("/api/admin/payments/stats/", {}, t).catch(
      () => null,
    ),
    apiFetch<PaginatedPayments>(
      "/api/admin/payments/?page_size=20",
      {},
      t,
    ).catch(() => null),
  ]);

  return (
    <PaymentsClient
      initialStats={stats}
      initialPayments={payments}
      accessToken={t}
    />
  );
}
