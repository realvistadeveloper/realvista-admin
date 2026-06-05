"use server";

// app/(dashboard)/properties/actions.ts
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccessLevel } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type {
  MarketProperty,
  PropertyFeature,
  PropertyCoordinate,
} from "./types";

// ── Status transition ─────────────────────────────────────────────────────────

export async function updatePropertyStatusAction(
  propertyId: number,
  status: string,
  rejection_reason?: string,
) {
  const { accessToken } = await requireAccessLevel(3);
  const result = await apiFetch<MarketProperty>(
    `/api/admin/properties/${propertyId}/status/`,
    { method: "PATCH", body: JSON.stringify({ status, rejection_reason }) },
    accessToken,
  );
  revalidatePath(`/properties/${propertyId}`);
  revalidatePath("/properties");
  return result;
}

// ── Update property fields ────────────────────────────────────────────────────

export async function updatePropertyAction(
  propertyId: number,
  payload: Record<string, unknown>,
) {
  const { accessToken } = await requireAccessLevel(3);
  const result = await apiFetch<MarketProperty>(
    `/api/admin/properties/${propertyId}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    accessToken,
  );
  revalidatePath(`/properties/${propertyId}`);
  revalidatePath("/properties");
  return result;
}

// ── Delete property ───────────────────────────────────────────────────────────

export async function deletePropertyAction(propertyId: number) {
  const { accessToken } = await requireAccessLevel(3);
  await apiFetch(
    `/api/admin/properties/${propertyId}/`,
    { method: "DELETE" },
    accessToken,
  );
  revalidatePath("/properties");
  redirect("/properties");
}

// ── Features ─────────────────────────────────────────────────────────────────

export async function updateFeatureAction(
  propertyId: number,
  featureId: number,
  payload: Partial<PropertyFeature>,
) {
  const { accessToken } = await requireAccessLevel(3);
  const result = await apiFetch<PropertyFeature>(
    `/api/admin/properties/${propertyId}/features/${featureId}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    accessToken,
  );
  revalidatePath(`/properties/${propertyId}`);
  return result;
}

export async function createFeatureAction(
  propertyId: number,
  payload: Partial<PropertyFeature>,
) {
  const { accessToken } = await requireAccessLevel(3);
  const result = await apiFetch<PropertyFeature>(
    `/api/admin/properties/${propertyId}/features/`,
    { method: "POST", body: JSON.stringify(payload) },
    accessToken,
  );
  revalidatePath(`/properties/${propertyId}`);
  return result;
}

// ── Coordinates ───────────────────────────────────────────────────────────────

export async function upsertCoordinateAction(
  propertyId: number,
  payload: { latitude: string; longitude: string },
  coordId?: number,
) {
  const { accessToken } = await requireAccessLevel(3);
  const url = coordId
    ? `/api/admin/properties/${propertyId}/coordinates/${coordId}/`
    : `/api/admin/properties/${propertyId}/coordinates/`;
  const result = await apiFetch<PropertyCoordinate>(
    url,
    { method: coordId ? "PATCH" : "POST", body: JSON.stringify(payload) },
    accessToken,
  );
  revalidatePath(`/properties/${propertyId}`);
  return result;
}

export async function deleteCoordinateAction(
  propertyId: number,
  coordId: number,
) {
  const { accessToken } = await requireAccessLevel(3);
  await apiFetch(
    `/api/admin/properties/${propertyId}/coordinates/${coordId}/`,
    { method: "DELETE" },
    accessToken,
  );
  revalidatePath(`/properties/${propertyId}`);
}

// ── Media upload ──────────────────────────────────────────────────────────────

export async function uploadPropertyMediaAction(
  propertyId: number,
  file: File,
  mediaType: "image" | "file",
  accessToken: string,
  name?: string,
) {
  const base = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "");
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE is not set.");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("media_type", mediaType);
  if (name) formData.append("name", name);

  const res = await fetch(
    `${base}/api/admin/properties/${propertyId}/upload-media/`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Upload failed (${res.status})`);
  }
  return res.json();
}

// ── Media delete ──────────────────────────────────────────────────────────────

export async function deletePropertyImageAction(
  propertyId: number,
  imageId: number,
) {
  const { accessToken } = await requireAccessLevel(3);
  await apiFetch(
    `/api/admin/properties/${propertyId}/images/${imageId}/`,
    { method: "DELETE" },
    accessToken,
  );
  revalidatePath(`/properties/${propertyId}`);
}

export async function deletePropertyFileAction(
  propertyId: number,
  fileId: number,
) {
  const { accessToken } = await requireAccessLevel(3);
  await apiFetch(
    `/api/admin/properties/${propertyId}/files/${fileId}/`,
    { method: "DELETE" },
    accessToken,
  );
  revalidatePath(`/properties/${propertyId}`);
}

// ── Create property ───────────────────────────────────────────────────────────

export async function createPropertyAction(payload: {
  owner_id: number;
  title: string;
  description: string;
  property_type: string;
  listing_purpose: string;
  category: string;
  price: string;
  currency: string;
  address: string;
  city: string;
  state: string;
  zip_code?: string;
  availability: string;
  availability_date?: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  square_feet?: number | null;
  lot_size?: string | null;
  year_built?: number | null;
  coordinate_url?: string;
  youtube_url?: string;
  status?: string;
}) {
  const { accessToken } = await requireAccessLevel(3);

  // Clean undefined optional fields — never send "$undefined" through Server Actions
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v !== undefined && v !== "") clean[k] = v;
  }

  const result = await apiFetch<MarketProperty>(
    "/api/admin/properties/",
    { method: "POST", body: JSON.stringify(clean) },
    accessToken,
  );
  revalidatePath("/properties");
  return result;
}
