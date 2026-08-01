// app/(dashboard)/agents/[id]/page.tsx
import { requireSession } from "@/lib/auth";
import { apiFetch, isAuthError } from "@/lib/api";
import { notFound, redirect } from "next/navigation";
import AgentDetailClient from "./agent-detail-client";
import type { Agent } from "../types";

async function fetchAgent(token: string, id: string): Promise<Agent | null> {
  try {
    return await apiFetch<Agent>(`/api/admin/agents/${id}/`, {}, token);
  } catch (err) {
    if (isAuthError(err)) redirect("/login?reason=session_expired");
    return null;
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AgentDetailPage({ params }: PageProps) {
  const session = await requireSession();
  const { id } = await params;
  const agent = await fetchAgent(session.accessToken, id);
  if (!agent) notFound();

  return (
    <AgentDetailClient
      agent={agent}
      accessToken={session.accessToken}
      adminLevel={session.user.access_level ?? 0}
    />
  );
}
