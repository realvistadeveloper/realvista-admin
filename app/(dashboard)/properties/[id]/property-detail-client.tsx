"use client";

// app/(dashboard)/properties/[id]/property-detail-client.tsx
import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import type { MarketProperty, PropertyStatus, PropertyFeature } from "../types";
import {
  updatePropertyStatusAction,
  updatePropertyAction,
  deletePropertyAction,
  updateFeatureAction,
  createFeatureAction,
  upsertCoordinateAction,
  uploadPropertyMediaAction,
  deletePropertyImageAction,
  deletePropertyFileAction,
} from "../actions";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  FileEdit,
  Image as ImageIcon,
  Map,
  Loader2,
  X,
  Check,
  TriangleAlert,
  Video,
  ExternalLink,
  Building2,
  Bed,
  Bath,
  Ruler,
  Calendar,
  Tag,
  Globe,
  Eye,
  MessageSquare,
  Bookmark as BookmarkIcon,
  Trash2,
  Upload,
  FileText,
  XCircle as RemoveIcon,
} from "lucide-react";
import { clsx } from "clsx";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "overview" | "details" | "features" | "media" | "location";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: Building2 },
  { id: "details", label: "Details", icon: FileEdit },
  { id: "features", label: "Features", icon: CheckCircle2 },
  { id: "media", label: "Media", icon: ImageIcon },
  { id: "location", label: "Location", icon: Map },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  PropertyStatus,
  { label: string; color: string; dot: string }
> = {
  draft: {
    label: "Draft",
    color: "bg-zinc-100 text-zinc-500",
    dot: "bg-zinc-400",
  },
  pending: {
    label: "Pending",
    color: "bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  published: {
    label: "Published",
    color: "bg-green-50 text-green-700",
    dot: "bg-green-500",
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-50 text-red-600",
    dot: "bg-red-400",
  },
};

function StatusBadge({ status }: { status: PropertyStatus }) {
  const c = STATUS_CONFIG[status];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold",
        c.color,
      )}
    >
      <span className={clsx("w-1.5 h-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}

function formatPrice(price: string, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(parseFloat(price));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return match?.[1] ?? null;
}

// ── Field components ──────────────────────────────────────────────────────────

function EditableField({
  label,
  value,
  onChange,
  type = "text",
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  multiline?: boolean;
}) {
  const base =
    "w-full text-sm border border-zinc-200 rounded-xl px-3 py-2 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-300";
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-zinc-500">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className={clsx(base, "resize-none")}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        />
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-zinc-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-300"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-zinc-50 last:border-0">
      <span className="text-sm text-zinc-600">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={clsx(
          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
          checked ? "bg-green-500" : "bg-zinc-200",
        )}
      >
        <span
          className={clsx(
            "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-4" : "translate-x-1",
          )}
        />
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PropertyDetailClient({
  property: initialProperty,
  accessToken,
}: {
  property: MarketProperty;
  accessToken: string;
}) {
  const [property, setProperty] = useState(initialProperty);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  // ── Status actions ──────────────────────────────────────────────────────

  const handleStatusChange = (newStatus: PropertyStatus, reason?: string) => {
    startTransition(async () => {
      try {
        const updated = await updatePropertyStatusAction(
          property.id,
          newStatus,
          reason,
        );
        setProperty(updated);
        showFeedback("success", `Property ${newStatus}.`);
        setShowRejectModal(false);
        setRejectionReason("");
      } catch {
        showFeedback("error", "Failed to update status.");
      }
    });
  };

  // ── Property save ───────────────────────────────────────────────────────

  const handlePropertySave = async (payload: Record<string, unknown>) => {
    try {
      const updated = await updatePropertyAction(property.id, payload);
      setProperty(updated);
      showFeedback("success", "Property updated.");
    } catch {
      showFeedback("error", "Failed to save changes.");
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Back */}
      <Link
        href="/properties"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to properties
      </Link>

      {/* Feedback */}
      {feedback && (
        <div
          className={clsx(
            "flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm",
            feedback.type === "success"
              ? "bg-green-50 text-green-700 border border-green-100"
              : "bg-red-50 text-red-700 border border-red-100",
          )}
        >
          <span>{feedback.msg}</span>
          <button onClick={() => setFeedback(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Header ── */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={property.status} />
              <span className="text-xs text-zinc-400 capitalize">
                {property.property_type.replace(/_/g, " ")}
              </span>
              <span className="text-xs text-zinc-300">·</span>
              <span className="text-xs text-zinc-400 capitalize">
                {property.listing_purpose}
              </span>
            </div>
            <h1 className="text-xl font-semibold text-zinc-900 leading-tight">
              {property.title}
            </h1>
            <p className="text-sm text-zinc-400">
              {property.city}, {property.state}
            </p>
          </div>

          {/* Action buttons based on current status */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {property.status === "pending" && (
              <>
                <button
                  onClick={() => handleStatusChange("published")}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-60"
                >
                  {isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  Publish
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-60"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
              </>
            )}
            {property.status === "published" && (
              <button
                onClick={() => handleStatusChange("draft")}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-zinc-100 text-zinc-700 rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-60"
              >
                <Clock className="w-3.5 h-3.5" /> Unpublish
              </button>
            )}
            {(property.status === "draft" ||
              property.status === "rejected") && (
              <button
                onClick={() => handleStatusChange("pending")}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-amber-50 text-amber-700 border border-amber-100 rounded-xl hover:bg-amber-100 transition-colors disabled:opacity-60"
              >
                <Clock className="w-3.5 h-3.5" /> Set Pending
              </button>
            )}
            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              title="Delete property"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-5 mt-4 pt-4 border-t border-zinc-50">
          <span className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Eye className="w-3.5 h-3.5" /> {property.views ?? 0} views
          </span>
          <span className="flex items-center gap-1.5 text-xs text-zinc-400">
            <MessageSquare className="w-3.5 h-3.5" /> {property.inquiries ?? 0}{" "}
            inquiries
          </span>
          <span className="flex items-center gap-1.5 text-xs text-zinc-400">
            <BookmarkIcon className="w-3.5 h-3.5" /> {property.bookmarked ?? 0}{" "}
            bookmarks
          </span>
          <span className="text-xs text-zinc-400 ml-auto">
            Listed {formatDate(property.listed_date)}
          </span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 bg-white rounded-2xl border border-zinc-100 p-1.5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors flex-1 justify-center",
              activeTab === tab.id
                ? "bg-zinc-900 text-white"
                : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50",
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab panels ── */}
      {activeTab === "overview" && <OverviewTab property={property} />}
      {activeTab === "details" && (
        <DetailsTab
          property={property}
          onSave={handlePropertySave}
          isPending={isPending}
        />
      )}
      {activeTab === "features" && (
        <FeaturesTab property={property} onFeedback={showFeedback} />
      )}
      {activeTab === "media" && (
        <MediaTab
          property={property}
          onSave={handlePropertySave}
          onFeedback={showFeedback}
          accessToken={accessToken}
        />
      )}
      {activeTab === "location" && (
        <LocationTab
          property={property}
          onSave={handlePropertySave}
          onFeedback={showFeedback}
        />
      )}

      {/* ── Reject modal ── */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-zinc-100 p-6 max-w-sm w-full shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-zinc-900">Reject property?</p>
                <p className="text-sm text-zinc-400">
                  Provide a reason for the owner.
                </p>
              </div>
            </div>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Incomplete information, incorrect pricing…"
              rows={3}
              className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-300"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 text-sm border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusChange("rejected", rejectionReason)}
                disabled={!rejectionReason.trim() || isPending}
                className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-zinc-100 p-6 max-w-sm w-full shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <TriangleAlert className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-zinc-900">Delete property?</p>
                <p className="text-sm text-zinc-400">This cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm bg-zinc-50 rounded-xl px-4 py-3 font-medium text-zinc-700 truncate">
              {property.title}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 text-sm border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  startTransition(() => deletePropertyAction(property.id));
                }}
                disabled={isPending}
                className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Overview ─────────────────────────────────────────────────────────────

function OverviewTab({ property }: { property: MarketProperty }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Key facts */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-3">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Key facts
        </p>
        <InfoRow
          icon={Tag}
          label="Price"
          value={formatPrice(property.price, property.currency)}
        />
        <InfoRow
          icon={Building2}
          label="Type"
          value={property.property_type.replace(/_/g, " ")}
          capitalize
        />
        <InfoRow
          icon={Globe}
          label="Purpose"
          value={property.listing_purpose}
          capitalize
        />
        <InfoRow
          icon={Calendar}
          label="Listed"
          value={formatDate(property.listed_date)}
        />
        {property.bedrooms != null && (
          <InfoRow
            icon={Bed}
            label="Bedrooms"
            value={String(property.bedrooms)}
          />
        )}
        {property.bathrooms && (
          <InfoRow icon={Bath} label="Bathrooms" value={property.bathrooms} />
        )}
        {property.square_feet && (
          <InfoRow
            icon={Ruler}
            label="Size"
            value={`${property.square_feet} m²`}
          />
        )}
      </div>

      {/* Owner */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-3">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Owner
        </p>
        <InfoRow
          icon={Building2}
          label="Name"
          value={property.owner?.name || "—"}
        />
        <InfoRow
          icon={Globe}
          label="Email"
          value={property.owner?.email || "—"}
        />
        <InfoRow
          icon={Tag}
          label="Type"
          value={property.owner?.is_agent ? "Agent" : "User"}
        />
        <InfoRow
          icon={CheckCircle2}
          label="Active"
          value={property.owner?.is_active ? "Yes" : "No"}
        />
      </div>

      {/* Description */}
      <div className="sm:col-span-2 bg-white rounded-2xl border border-zinc-100 p-5">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Description
        </p>
        <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">
          {property.description || (
            <span className="text-zinc-300 italic">
              No description provided.
            </span>
          )}
        </p>
      </div>

      {/* First image preview */}
      {property.images?.[0] && (
        <div className="sm:col-span-2 bg-white rounded-2xl border border-zinc-100 overflow-hidden">
          <img
            src={property.images[0].image_url || property.images[0].image || ""}
            alt={property.title}
            className="w-full h-56 object-cover"
          />
        </div>
      )}
    </div>
  );
}

// ── Tab: Details ──────────────────────────────────────────────────────────────

function DetailsTab({
  property,
  onSave,
  isPending,
}: {
  property: MarketProperty;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  isPending: boolean;
}) {
  const [form, setForm] = useState({
    title: property.title,
    description: property.description,
    price: property.price,
    currency: property.currency,
    listing_purpose: property.listing_purpose,
    category: property.category,
    property_type: property.property_type,
    address: property.address,
    city: property.city,
    state: property.state,
    zip_code: property.zip_code ?? "",
    bedrooms: property.bedrooms != null ? String(property.bedrooms) : "",
    bathrooms: property.bathrooms ?? "",
    square_feet:
      property.square_feet != null ? String(property.square_feet) : "",
    lot_size: property.lot_size ?? "",
    year_built: property.year_built != null ? String(property.year_built) : "",
    availability: property.availability,
    availability_date: property.availability_date ?? "",
  });

  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const [saving, startSave] = useTransition();

  const handleSave = () => {
    startSave(async () => {
      const payload: Record<string, unknown> = { ...form };
      // Convert numeric strings back to numbers/null
      payload.bedrooms = form.bedrooms ? parseInt(form.bedrooms) : null;
      payload.bathrooms = form.bathrooms ? parseFloat(form.bathrooms) : null;
      payload.square_feet = form.square_feet
        ? parseInt(form.square_feet)
        : null;
      payload.lot_size = form.lot_size || null;
      payload.year_built = form.year_built ? parseInt(form.year_built) : null;
      payload.zip_code = form.zip_code || null;
      payload.availability_date = form.availability_date || null;
      await onSave(payload);
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Edit details
        </p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          Save changes
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <EditableField
            label="Title"
            value={form.title}
            onChange={set("title")}
          />
        </div>
        <div className="sm:col-span-2">
          <EditableField
            label="Description"
            value={form.description}
            onChange={set("description")}
            multiline
          />
        </div>
        <EditableField
          label="Price"
          value={form.price}
          onChange={set("price")}
          type="number"
        />
        <SelectField
          label="Currency"
          value={form.currency}
          onChange={set("currency")}
          options={[
            { value: "NGN", label: "NGN — Naira" },
            { value: "USD", label: "USD — Dollar" },
            { value: "EUR", label: "EUR — Euro" },
            { value: "GBP", label: "GBP — Pound" },
          ]}
        />
        <SelectField
          label="Listing purpose"
          value={form.listing_purpose}
          onChange={set("listing_purpose")}
          options={[
            { value: "sale", label: "For Sale" },
            { value: "lease", label: "For Lease" },
            { value: "rent", label: "For Rent" },
          ]}
        />
        <SelectField
          label="Category"
          value={form.category}
          onChange={set("category")}
          options={[
            { value: "corporate", label: "Corporate" },
            { value: "p2p", label: "Peer-to-Peer" },
          ]}
        />
        <SelectField
          label="Property type"
          value={form.property_type}
          onChange={set("property_type")}
          options={[
            "house",
            "apartment",
            "land",
            "commercial",
            "office",
            "warehouse",
            "shop",
            "duplex",
            "bungalow",
            "terrace",
            "semi_detached",
            "detached",
            "farm_land",
            "industrial",
            "short_let",
            "studio",
          ].map((t) => ({ value: t, label: t.replace(/_/g, " ") }))}
        />
        <SelectField
          label="Availability"
          value={form.availability}
          onChange={set("availability")}
          options={[
            { value: "now", label: "Available now" },
            { value: "date", label: "From a date" },
          ]}
        />
        {form.availability === "date" && (
          <EditableField
            label="Available from"
            value={form.availability_date}
            onChange={set("availability_date")}
            type="date"
          />
        )}
        <div className="sm:col-span-2">
          <EditableField
            label="Address"
            value={form.address}
            onChange={set("address")}
          />
        </div>
        <EditableField label="City" value={form.city} onChange={set("city")} />
        <EditableField
          label="State"
          value={form.state}
          onChange={set("state")}
        />
        <EditableField
          label="Zip code"
          value={form.zip_code}
          onChange={set("zip_code")}
        />
        <EditableField
          label="Bedrooms"
          value={form.bedrooms}
          onChange={set("bedrooms")}
          type="number"
        />
        <EditableField
          label="Bathrooms"
          value={form.bathrooms}
          onChange={set("bathrooms")}
          type="number"
        />
        <EditableField
          label="Size (m²)"
          value={form.square_feet}
          onChange={set("square_feet")}
          type="number"
        />
        <EditableField
          label="Lot size (m²)"
          value={form.lot_size}
          onChange={set("lot_size")}
          type="number"
        />
        <EditableField
          label="Year built"
          value={form.year_built}
          onChange={set("year_built")}
          type="number"
        />
      </div>
    </div>
  );
}

// ── Tab: Features ─────────────────────────────────────────────────────────────

function FeaturesTab({
  property,
  onFeedback,
}: {
  property: MarketProperty;
  onFeedback: (type: "success" | "error", msg: string) => void;
}) {
  const existing = property.features?.[0];

  // Sanitize electricity_proximity — old data may have "near" instead of "nearby"
  const sanitizeFeature = (
    f: Partial<PropertyFeature>,
  ): Partial<PropertyFeature> => ({
    ...f,
    electricity_proximity:
      f.electricity_proximity === "near" ? "nearby" : f.electricity_proximity,
  });

  const [feature, setFeature] = useState<Partial<PropertyFeature>>(
    existing
      ? sanitizeFeature(existing)
      : {
          negotiable: "no",
          furnished: false,
          pet_friendly: false,
          parking_available: false,
          swimming_pool: false,
          garden: false,
          electricity_proximity: "moderate",
          road_network: "good",
          development_level: "moderate",
          water_supply: false,
          security: false,
          additional_features: "",
        },
  );
  const [saving, startSave] = useTransition();

  const setF = (k: keyof PropertyFeature) => (v: unknown) =>
    setFeature((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    startSave(async () => {
      try {
        if (existing?.id) {
          await updateFeatureAction(property.id, existing.id, feature);
        } else {
          await createFeatureAction(property.id, feature);
        }
        onFeedback("success", "Features saved.");
      } catch {
        onFeedback("error", "Failed to save features.");
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Property features
        </p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          Save features
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-medium text-zinc-400 mb-3">Amenities</p>
          <ToggleRow
            label="Furnished"
            checked={!!feature.furnished}
            onChange={setF("furnished")}
          />
          <ToggleRow
            label="Pet friendly"
            checked={!!feature.pet_friendly}
            onChange={setF("pet_friendly")}
          />
          <ToggleRow
            label="Parking available"
            checked={!!feature.parking_available}
            onChange={setF("parking_available")}
          />
          <ToggleRow
            label="Swimming pool"
            checked={!!feature.swimming_pool}
            onChange={setF("swimming_pool")}
          />
          <ToggleRow
            label="Garden"
            checked={!!feature.garden}
            onChange={setF("garden")}
          />
          <ToggleRow
            label="Water supply"
            checked={!!feature.water_supply}
            onChange={setF("water_supply")}
          />
          <ToggleRow
            label="Security"
            checked={!!feature.security}
            onChange={setF("security")}
          />
        </div>

        <div className="space-y-4">
          <SelectField
            label="Negotiable"
            value={feature.negotiable ?? "no"}
            onChange={setF("negotiable")}
            options={[
              { value: "yes", label: "Yes" },
              { value: "slightly", label: "Slightly" },
              { value: "no", label: "No" },
            ]}
          />
          <SelectField
            label="Electricity proximity"
            value={feature.electricity_proximity ?? "moderate"}
            onChange={setF("electricity_proximity")}
            options={[
              { value: "nearby", label: "Nearby (<100m)" },
              { value: "moderate", label: "Moderate (100-500m)" },
              { value: "far", label: "Far (>500m)" },
              { value: "available", label: "Available" },
            ]}
          />
          <SelectField
            label="Road network"
            value={feature.road_network ?? "good"}
            onChange={setF("road_network")}
            options={[
              { value: "excellent", label: "Excellent" },
              { value: "good", label: "Good" },
              { value: "fair", label: "Fair" },
              { value: "poor", label: "Poor" },
            ]}
          />
          <SelectField
            label="Development level"
            value={feature.development_level ?? "moderate"}
            onChange={setF("development_level")}
            options={[
              { value: "high", label: "Highly developed" },
              { value: "moderate", label: "Moderately developed" },
              { value: "low", label: "Sparsely developed" },
              { value: "undeveloped", label: "Undeveloped" },
            ]}
          />
          <EditableField
            label="Additional notes"
            value={feature.additional_features ?? ""}
            onChange={setF("additional_features") as (v: string) => void}
            multiline
          />
        </div>
      </div>
    </div>
  );
}

// ── Tab: Media ────────────────────────────────────────────────────────────────

function MediaTab({
  property,
  onSave,
  onFeedback,
  accessToken,
}: {
  property: MarketProperty;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  onFeedback: (type: "success" | "error", msg: string) => void;
  accessToken: string;
}) {
  const [youtubeUrl, setYoutubeUrl] = useState(property.youtube_url ?? "");
  const [saving, startSave] = useTransition();

  // Local copies so UI updates instantly after upload/delete
  const [images, setImages] = useState(property.images ?? []);
  const [files, setFiles] = useState(property.files ?? []);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const youtubeId = youtubeUrl ? getYouTubeId(youtubeUrl) : null;

  const handleSaveUrls = () => {
    startSave(async () => {
      try {
        await onSave({ youtube_url: youtubeUrl || null });
        onFeedback("success", "YouTube URL saved.");
      } catch {
        onFeedback("error", "Failed to save.");
      }
    });
  };

  // ── Image upload ──────────────────────────────────────────────────────────

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploadingImage(true);
    try {
      const record = await uploadPropertyMediaAction(
        property.id,
        file,
        "image",
        accessToken,
      );
      setImages((prev) => [...prev, record]);
      onFeedback("success", "Image uploaded.");
    } catch (err: unknown) {
      onFeedback(
        "error",
        err instanceof Error ? err.message : "Upload failed.",
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageDelete = async (imageId: number) => {
    try {
      await deletePropertyImageAction(property.id, imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      onFeedback("success", "Image removed.");
    } catch {
      onFeedback("error", "Failed to delete image.");
    }
  };

  // ── File upload ───────────────────────────────────────────────────────────

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploadingFile(true);
    try {
      const record = await uploadPropertyMediaAction(
        property.id,
        file,
        "file",
        accessToken,
        file.name,
      );
      setFiles((prev) => [...prev, record]);
      onFeedback("success", "File uploaded.");
    } catch (err: unknown) {
      onFeedback(
        "error",
        err instanceof Error ? err.message : "Upload failed.",
      );
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFileDelete = async (fileId: number) => {
    try {
      await deletePropertyFileAction(property.id, fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      onFeedback("success", "File removed.");
    } catch {
      onFeedback("error", "Failed to delete file.");
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Images ── */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Images ({images.length})
          </p>
          <button
            onClick={() => imageInputRef.current?.click()}
            disabled={uploadingImage}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-60"
          >
            {uploadingImage ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            Upload image
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/bmp,.heic,.heif"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>

        {images.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img) => (
              <div
                key={img.id}
                className="relative group aspect-square rounded-xl overflow-hidden bg-zinc-100 border border-zinc-100"
              >
                <img
                  src={img.image_url || img.image || ""}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleImageDelete(img.id)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <button
            onClick={() => imageInputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center py-10 border-2 border-dashed border-zinc-100 rounded-xl text-zinc-400 hover:border-zinc-200 hover:bg-zinc-50 transition-colors"
          >
            <ImageIcon className="w-8 h-8 mb-2 text-zinc-300" />
            <p className="text-sm">Click to upload images</p>
            <p className="text-xs mt-1 text-zinc-300">
              JPG, PNG, GIF, WebP, HEIC
            </p>
          </button>
        )}
      </div>

      {/* ── YouTube ── */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-red-500" />
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              YouTube tour
            </p>
          </div>
          <button
            onClick={handleSaveUrls}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            Save
          </button>
        </div>
        <EditableField
          label="YouTube URL"
          value={youtubeUrl}
          onChange={setYoutubeUrl}
          type="url"
        />
        {youtubeId && (
          <div className="rounded-xl overflow-hidden border border-zinc-100 aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        )}
        {youtubeUrl && !youtubeId && (
          <p className="text-xs text-red-500">
            Invalid YouTube URL — paste a full youtube.com or youtu.be link.
          </p>
        )}
      </div>

      {/* ── Files ── */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Files ({files.length})
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFile}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-60"
          >
            {uploadingFile ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            Upload file
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.mp4,.mov,.avi,.mkv,.mp3"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {files.length ? (
          <div className="space-y-2">
            {files.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between py-2.5 border-b border-zinc-50 last:border-0 group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-700 truncate">
                      {f.name || "Unnamed file"}
                    </p>
                    <p className="text-xs text-zinc-400">{f.file_type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {(f.file || f.image_url) && (
                    <a
                      href={f.file || f.image_url || ""}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-zinc-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => handleFileDelete(f.id)}
                    className="text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center py-8 border-2 border-dashed border-zinc-100 rounded-xl text-zinc-400 hover:border-zinc-200 hover:bg-zinc-50 transition-colors"
          >
            <FileText className="w-7 h-7 mb-2 text-zinc-300" />
            <p className="text-sm">Click to upload files</p>
            <p className="text-xs mt-1 text-zinc-300">
              Images, PDF, Word, Video, Audio
            </p>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Tab: Location ─────────────────────────────────────────────────────────────

function LocationTab({
  property,
  onSave,
  onFeedback,
}: {
  property: MarketProperty;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  onFeedback: (type: "success" | "error", msg: string) => void;
}) {
  const existingCoord = property.coordinates?.[0];
  const [lat, setLat] = useState(existingCoord?.latitude ?? "");
  const [lng, setLng] = useState(existingCoord?.longitude ?? "");
  const [saving, startSave] = useTransition();

  const handleSave = () => {
    startSave(async () => {
      try {
        await upsertCoordinateAction(
          property.id,
          { latitude: lat, longitude: lng },
          existingCoord?.id,
        );
        onFeedback("success", "Coordinates saved.");
      } catch {
        onFeedback("error", "Failed to save coordinates.");
      }
    });
  };

  const mapsUrl =
    lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : null;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Coordinates
          </p>
          <button
            onClick={handleSave}
            disabled={saving || !lat || !lng}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            Save
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <EditableField
            label="Latitude"
            value={lat}
            onChange={setLat}
            type="number"
          />
          <EditableField
            label="Longitude"
            value={lng}
            onChange={setLng}
            type="number"
          />
        </div>
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View on Google Maps
          </a>
        )}
      </div>

      {/* Address summary */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-3">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Address
        </p>
        <InfoRow icon={Map} label="Address" value={property.address} />
        <InfoRow icon={Globe} label="City" value={property.city} />
        <InfoRow icon={Globe} label="State" value={property.state} />
        {property.zip_code && (
          <InfoRow icon={Tag} label="Zip" value={property.zip_code} />
        )}
      </div>
    </div>
  );
}

// ── InfoRow (shared) ──────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
  capitalize,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-sm text-zinc-500 shrink-0">
        <Icon className="w-3.5 h-3.5 text-zinc-300" />
        {label}
      </div>
      <span
        className={clsx(
          "text-sm text-zinc-800 truncate text-right",
          capitalize && "capitalize",
        )}
      >
        {value}
      </span>
    </div>
  );
}
