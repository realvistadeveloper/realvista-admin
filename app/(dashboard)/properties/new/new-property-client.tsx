"use client";

// app/(dashboard)/properties/new/new-property-client.tsx
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPropertyAction } from "../actions";
import {
  ArrowLeft,
  Building2,
  Loader2,
  Check,
  X,
  MapPin,
  Tag,
  Ruler,
  FileText,
  Search,
} from "lucide-react";
import { clsx } from "clsx";

// ── Field components ──────────────────────────────────────────────────────────

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-zinc-500">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputCls = (err?: string) =>
  clsx(
    "w-full text-sm border rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-300",
    err ? "border-red-300 bg-red-50" : "border-zinc-200",
  );

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 pb-1 border-b border-zinc-100">
      <Icon className="w-4 h-4 text-zinc-400" />
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
        {title}
      </p>
    </div>
  );
}

// ── Owner search ──────────────────────────────────────────────────────────────

interface OwnerOption {
  id: number;
  name: string;
  email: string;
  is_agent: boolean;
}

function OwnerSearch({
  value,
  onChange,
  accessToken,
}: {
  value: OwnerOption | null;
  onChange: (o: OwnerOption | null) => void;
  accessToken: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OwnerOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);

  const search = async (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    setSearching(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
      const res = await fetch(
        `${base}/api/admin/all-users/?search=${encodeURIComponent(q)}&page_size=8`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const data = await res.json();
      setResults(data.results ?? []);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-zinc-600">
              {value.name?.[0]?.toUpperCase() ?? "U"}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-800 truncate">
              {value.name}
            </p>
            <p className="text-xs text-zinc-400 truncate">
              {value.email} · {value.is_agent ? "Agent" : "User"}
            </p>
          </div>
        </div>
        <button
          onClick={() => onChange(null)}
          className="text-zinc-400 hover:text-zinc-700 shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        <input
          value={query}
          onChange={(e) => search(e.target.value)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search by name or email…"
          className="w-full pl-9 pr-4 text-sm border border-zinc-200 rounded-xl py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-300"
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 animate-spin" />
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg z-20 overflow-hidden">
          {results.map((u) => (
            <button
              key={u.id}
              onMouseDown={() => {
                onChange(u);
                setQuery("");
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 text-left border-b border-zinc-50 last:border-0"
            >
              <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-zinc-500">
                  {u.name?.[0]?.toUpperCase() ?? "U"}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-800 truncate">
                  {u.name}
                </p>
                <p className="text-xs text-zinc-400 truncate">
                  {u.email} · {u.is_agent ? "Agent" : "User"}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface NewPropertyClientProps {
  preselectedOwner: OwnerOption | null;
  accessToken: string;
}

export default function NewPropertyClient({
  preselectedOwner,
  accessToken,
}: NewPropertyClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Owner
  const [owner, setOwner] = useState<OwnerOption | null>(preselectedOwner);

  // Core
  const [title, setTitle] = useState("");
  const [propertyType, setPropertyType] = useState("house");
  const [listingPurpose, setListingPurpose] = useState("sale");
  const [category, setCategory] = useState("corporate");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("NGN");

  // Location
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");

  // Specs
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [squareFeet, setSquareFeet] = useState("");
  const [lotSize, setLotSize] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");
  const [availability, setAvailability] = useState("now");
  const [availDate, setAvailDate] = useState("");

  // Description
  const [description, setDescription] = useState("");

  // Errors + feedback
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const isLand = propertyType === "land";

  const validate = () => {
    const e: Record<string, string> = {};
    if (!owner) e.owner = "Select an owner.";
    if (!title.trim()) e.title = "Title is required.";
    if (!price.trim()) e.price = "Price is required.";
    if (!address.trim()) e.address = "Address is required.";
    if (!city.trim()) e.city = "City is required.";
    if (!state.trim()) e.state = "State is required.";
    if (!description.trim()) e.description = "Description is required.";
    if (availability === "date" && !availDate)
      e.availDate = "Select an availability date.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    startTransition(async () => {
      try {
        const property = await createPropertyAction({
          owner_id: owner!.id,
          title: title.trim(),
          description: description.trim(),
          property_type: propertyType,
          listing_purpose: listingPurpose,
          category,
          price,
          currency,
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          zip_code: zipCode.trim() || undefined,
          availability,
          availability_date: availability === "date" ? availDate : undefined,
          bedrooms: !isLand && bedrooms ? parseInt(bedrooms) : null,
          bathrooms: !isLand && bathrooms ? parseFloat(bathrooms) : null,
          square_feet: squareFeet ? parseInt(squareFeet) : null,
          lot_size: lotSize || null,
          year_built: yearBuilt ? parseInt(yearBuilt) : null,
          status: "pending",
        });
        router.push(`/properties/${property.id}`);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to create property.";
        setFeedback({ type: "error", msg });
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <div className="flex items-center justify-between">
        <Link
          href="/properties"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to properties
        </Link>
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Create property
        </button>
      </div>

      <div>
        <h1 className="text-lg font-semibold text-zinc-900">New property</h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          Property will be created as{" "}
          <span className="font-medium text-amber-600">pending review</span>.
        </p>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={clsx(
            "flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm",
            feedback.type === "error"
              ? "bg-red-50 text-red-700 border border-red-100"
              : "bg-green-50 text-green-700 border border-green-100",
          )}
        >
          <span>{feedback.msg}</span>
          <button onClick={() => setFeedback(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Owner ── */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-4">
        <SectionHeader icon={Tag} title="Owner" />
        <Field label="Property owner" required error={errors.owner}>
          <OwnerSearch
            value={owner}
            onChange={setOwner}
            accessToken={accessToken}
          />
        </Field>
      </div>

      {/* ── Core details ── */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-4">
        <SectionHeader icon={Building2} title="Property details" />
        <Field label="Title" required error={errors.title}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 3-bedroom duplex in Lekki Phase 1"
            className={inputCls(errors.title)}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Property type" required>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className={inputCls()}
            >
              {[
                ["house", "House"],
                ["apartment", "Apartment"],
                ["land", "Land"],
                ["commercial", "Commercial"],
                ["office", "Office Space"],
                ["warehouse", "Warehouse"],
                ["shop", "Shop/Store"],
                ["duplex", "Duplex"],
                ["bungalow", "Bungalow"],
                ["terrace", "Terrace"],
                ["semi_detached", "Semi-Detached"],
                ["detached", "Detached"],
                ["farm_land", "Farm Land"],
                ["industrial", "Industrial"],
                ["short_let", "Short Let"],
                ["studio", "Studio"],
              ].map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Purpose" required>
            <select
              value={listingPurpose}
              onChange={(e) => setListingPurpose(e.target.value)}
              className={inputCls()}
            >
              <option value="sale">For Sale</option>
              <option value="lease">For Lease</option>
              <option value="rent">For Rent</option>
            </select>
          </Field>
          <Field label="Category" required>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputCls()}
            >
              <option value="corporate">Corporate</option>
              <option value="p2p">Peer-to-Peer</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Price" required error={errors.price}>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              type="number"
              placeholder="0.00"
              className={inputCls(errors.price)}
            />
          </Field>
          <Field label="Currency" required>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={inputCls()}
            >
              <option value="NGN">NGN — Naira</option>
              <option value="USD">USD — Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — Pound</option>
            </select>
          </Field>
        </div>
      </div>

      {/* ── Location ── */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-4">
        <SectionHeader icon={MapPin} title="Location" />
        <Field label="Address" required error={errors.address}>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Full street address"
            className={inputCls(errors.address)}
          />
        </Field>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="City" required error={errors.city}>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Lagos"
              className={inputCls(errors.city)}
            />
          </Field>
          <Field label="State" required error={errors.state}>
            <input
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="e.g. Lagos State"
              className={inputCls(errors.state)}
            />
          </Field>
          <Field label="Zip code">
            <input
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="Optional"
              className={inputCls()}
            />
          </Field>
        </div>
      </div>

      {/* ── Specs ── */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-4">
        <SectionHeader icon={Ruler} title="Specifications" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {!isLand && (
            <>
              <Field label="Bedrooms">
                <input
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  type="number"
                  min="0"
                  placeholder="—"
                  className={inputCls()}
                />
              </Field>
              <Field label="Bathrooms">
                <input
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="—"
                  className={inputCls()}
                />
              </Field>
            </>
          )}
          <Field label="Size (m²)">
            <input
              value={squareFeet}
              onChange={(e) => setSquareFeet(e.target.value)}
              type="number"
              min="0"
              placeholder="—"
              className={inputCls()}
            />
          </Field>
          <Field label="Lot size (m²)">
            <input
              value={lotSize}
              onChange={(e) => setLotSize(e.target.value)}
              type="number"
              min="0"
              placeholder="—"
              className={inputCls()}
            />
          </Field>
          <Field label="Year built">
            <input
              value={yearBuilt}
              onChange={(e) => setYearBuilt(e.target.value)}
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              placeholder="—"
              className={inputCls()}
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Availability" required>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className={inputCls()}
            >
              <option value="now">Available now</option>
              <option value="date">From a specific date</option>
            </select>
          </Field>
          {availability === "date" && (
            <Field label="Available from" required error={errors.availDate}>
              <input
                value={availDate}
                onChange={(e) => setAvailDate(e.target.value)}
                type="date"
                className={inputCls(errors.availDate)}
              />
            </Field>
          )}
        </div>
      </div>

      {/* ── Description ── */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-4">
        <SectionHeader icon={FileText} title="Description" />
        <Field label="Description" required error={errors.description}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Describe the property — location highlights, key features, nearby amenities…"
            className={clsx(inputCls(errors.description), "resize-none")}
          />
        </Field>
      </div>

      {/* ── Submit ── */}
      <div className="flex items-center justify-between pb-8">
        <p className="text-xs text-zinc-400">
          After saving, you can add images, features, coordinates, and publish
          from the property page.
        </p>
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-60 shrink-0"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Create property
        </button>
      </div>
    </div>
  );
}
