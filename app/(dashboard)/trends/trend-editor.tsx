"use client";

// app/(dashboard)/trends/trend-editor.tsx
import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RichTextEditor, {
  RichTextPreview,
} from "@/components/ui/RichTextEditor";
import {
  createTrendAction,
  updateTrendAction,
  togglePublishAction,
  deleteTrendAction,
} from "./actions";
import { uploadTrendImage } from "@/lib/upload";
import type { Trend, Category } from "./types";
import {
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Trash2,
  Loader2,
  X,
  Globe,
  FileText,
  TriangleAlert,
  BookOpen,
  ImagePlus,
  XCircle,
} from "lucide-react";
import { clsx } from "clsx";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-zinc-500">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full text-sm border border-zinc-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-300";

interface TrendEditorProps {
  mode: "create" | "edit";
  trend?: Trend;
  categories: Category[];
  accessToken: string;
}

export default function TrendEditor({
  mode,
  trend,
  categories,
  accessToken,
}: TrendEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [title, setTitle] = useState(trend?.title ?? "");
  const [body, setBody] = useState(trend?.body ?? "");
  const [source, setSource] = useState(trend?.source ?? "");
  const [url, setUrl] = useState(trend?.url ?? "");
  const [categoryId, setCategoryId] = useState(
    trend?.category ? String(trend.category) : String(categories[0]?.id ?? ""),
  );
  const [isPublished, setIsPublished] = useState(trend?.publish ?? false);

  // Cover image state
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    trend?.cover_image ?? null,
  );
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);

  // UI state
  const [previewMode, setPreviewMode] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Saved trend id (set after first create so publish works immediately)
  const [savedId, setSavedId] = useState<number | null>(trend?.id ?? null);

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Title is required.";
    if (!body.trim() || body === "<p></p>") e.body = "Body cannot be empty.";
    if (!source.trim()) e.source = "Source is required.";
    if (!categoryId) e.category = "Select a category.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Cover image ───────────────────────────────────────────────────────────

  const handleCoverPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const uploadCoverIfNeeded = async (id: number) => {
    if (!coverFile) return;
    setCoverUploading(true);
    try {
      const result = await uploadTrendImage(
        id,
        coverFile,
        "cover",
        accessToken,
      );
      if (result.cover_url) {
        setCoverFile(null); // mark as uploaded — "Unsaved" badge disappears
      } else {
        throw new Error("No cover_url returned from server.");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Cover image upload failed.";
      showFeedback("error", msg);
      throw err; // re-throw so handleSave can stop and show the error
    } finally {
      setCoverUploading(false);
    }
  };

  // ── Inline image upload (passed to editor) ────────────────────────────────

  const handleInlineImageUpload = async (file: File): Promise<string> => {
    const id = savedId ?? trend?.id;
    if (!id)
      throw new Error("Save the article before uploading inline images.");
    const result = await uploadTrendImage(id, file, "inline", accessToken);
    if (!result.url) throw new Error("No URL returned.");
    return result.url;
  };

  // ── Save draft ────────────────────────────────────────────────────────────

  const handleSave = () => {
    if (!validate()) return;
    startTransition(async () => {
      try {
        const trimmedUrl = url.trim() || undefined;

        const contentPayload = {
          title: title.trim(),
          body,
          source: source.trim(),
          category: parseInt(categoryId),
          ...(trimmedUrl && { url: trimmedUrl }),
        };

        if (mode === "create") {
          const created = await createTrendAction({
            ...contentPayload,
            publish: false,
          });
          setSavedId(created.id);
          await uploadCoverIfNeeded(created.id);
          showFeedback("success", "Draft saved.");
          router.replace(`/trends/${created.id}`);
        } else {
          await updateTrendAction(trend!.id, contentPayload);
          await uploadCoverIfNeeded(trend!.id);
          showFeedback("success", "Saved.");
        }
      } catch {
        showFeedback("error", "Failed to save.");
      }
    });
  };

  // ── Publish / unpublish ───────────────────────────────────────────────────

  const handleTogglePublish = () => {
    const id = savedId ?? trend?.id;
    if (!id) {
      showFeedback("error", "Save as draft first.");
      return;
    }
    if (!validate()) return;
    startTransition(async () => {
      try {
        if (mode === "edit") {
          const trimmedUrl = url.trim() || undefined;
          await updateTrendAction(id, {
            title: title.trim(),
            body,
            source: source.trim(),
            category: parseInt(categoryId),
            ...(trimmedUrl && { url: trimmedUrl }),
          });
        }
        await uploadCoverIfNeeded(id);
        const r = await togglePublishAction(id, !isPublished);
        setIsPublished(r.publish);
        showFeedback("success", r.detail);
      } catch {
        showFeedback("error", "Failed to update publish status.");
      }
    });
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = () => {
    const id = savedId ?? trend?.id;
    if (!id) return;
    startTransition(async () => {
      try {
        await deleteTrendAction(id);
      } catch {
        showFeedback("error", "Failed to delete.");
        setShowDelete(false);
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          href="/trends"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to trends
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={clsx(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold",
              isPublished
                ? "bg-green-50 text-green-700"
                : "bg-zinc-100 text-zinc-500",
            )}
          >
            {isPublished ? (
              <>
                <Globe className="w-3 h-3" /> Published
              </>
            ) : (
              <>
                <FileText className="w-3 h-3" /> Draft
              </>
            )}
          </span>

          <button
            onClick={() => setPreviewMode((p) => !p)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            {previewMode ? (
              <>
                <EyeOff className="w-3.5 h-3.5" /> Edit
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" /> Preview
              </>
            )}
          </button>

          <button
            onClick={handleSave}
            disabled={isPending || coverUploading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-zinc-200 rounded-xl text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-60"
          >
            {isPending || coverUploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save draft
          </button>

          {(mode === "edit" || savedId) && (
            <button
              onClick={handleTogglePublish}
              disabled={isPending || coverUploading}
              className={clsx(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-xl transition-colors disabled:opacity-60",
                isPublished
                  ? "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  : "bg-green-600 text-white hover:bg-green-700",
              )}
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isPublished ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <BookOpen className="w-3.5 h-3.5" />
              )}
              {isPublished ? "Unpublish" : "Publish"}
            </button>
          )}

          {(mode === "edit" || savedId) && (
            <button
              onClick={() => setShowDelete(true)}
              className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start">
        {/* Main content */}
        <div className="space-y-4">
          <div>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors((p) => ({ ...p, title: "" }));
              }}
              placeholder="Article title…"
              className={clsx(
                "w-full text-2xl font-semibold bg-white border rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-zinc-300 placeholder:text-zinc-300 placeholder:font-normal",
                errors.title ? "border-red-300" : "border-zinc-200",
              )}
            />
            {errors.title && (
              <p className="text-xs text-red-500 mt-1 px-1">{errors.title}</p>
            )}
          </div>

          <div>
            {previewMode ? (
              <div className="bg-white rounded-2xl border border-zinc-200 px-8 py-6 min-h-[400px]">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                  Preview
                </p>
                {body && body !== "<p></p>" ? (
                  <RichTextPreview html={body} />
                ) : (
                  <p className="text-zinc-300 italic text-sm">
                    Nothing to preview yet.
                  </p>
                )}
              </div>
            ) : (
              <div>
                <RichTextEditor
                  value={body}
                  onChange={(v) => {
                    setBody(v);
                    setErrors((p) => ({ ...p, body: "" }));
                  }}
                  placeholder="Write your article here…"
                  minHeight={420}
                  onImageUpload={savedId ? handleInlineImageUpload : undefined}
                />
                {!savedId && (
                  <p className="text-xs text-zinc-400 mt-1.5 px-1">
                    Save as draft first to enable inline image uploads.
                  </p>
                )}
                {errors.body && (
                  <p className="text-xs text-red-500 mt-1 px-1">
                    {errors.body}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 lg:sticky lg:top-6">
          {/* Cover image */}
          <div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-3">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Cover image
            </p>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleCoverPick}
            />
            {coverPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-zinc-100">
                <img
                  src={coverPreview}
                  alt="Cover"
                  className="w-full h-36 object-cover"
                />
                <button
                  onClick={() => {
                    setCoverPreview(null);
                    setCoverFile(null);
                  }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <XCircle className="w-4 h-4 text-white" />
                </button>
                {coverFile && (
                  <div className="absolute bottom-2 left-2">
                    <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-md font-medium">
                      Unsaved
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => coverInputRef.current?.click()}
                className="w-full h-28 border-2 border-dashed border-zinc-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-zinc-300 hover:bg-zinc-50 transition-colors text-zinc-400"
              >
                <ImagePlus className="w-5 h-5" />
                <span className="text-xs font-medium">Upload cover image</span>
                <span className="text-xs text-zinc-300">
                  JPG, PNG, GIF, WebP
                </span>
              </button>
            )}
          </div>

          {/* Article details */}
          <div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-4">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Article details
            </p>

            <Field label="Category" required>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setErrors((p) => ({ ...p, category: "" }));
                }}
                className={clsx(
                  inputClass,
                  errors.category && "border-red-300",
                )}
              >
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-xs text-red-500">{errors.category}</p>
              )}
            </Field>

            <Field label="Source" required>
              <input
                value={source}
                onChange={(e) => {
                  setSource(e.target.value);
                  setErrors((p) => ({ ...p, source: "" }));
                }}
                placeholder="e.g. Reuters, BBC, Own"
                className={clsx(inputClass, errors.source && "border-red-300")}
              />
              {errors.source && (
                <p className="text-xs text-red-500">{errors.source}</p>
              )}
            </Field>

            <Field label="Source URL">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                type="url"
                placeholder="https://…"
                className={inputClass}
              />
            </Field>
          </div>

          {/* Info (edit mode) */}
          {mode === "edit" && trend && (
            <div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-3">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Info
              </p>
              {[
                { label: "Views", value: trend.views?.toLocaleString() ?? "0" },
                {
                  label: "Created",
                  value: new Date(trend.date_created).toLocaleDateString(
                    "en-GB",
                    { day: "2-digit", month: "short", year: "numeric" },
                  ),
                },
                {
                  label: "Updated",
                  value: new Date(trend.date_updated).toLocaleDateString(
                    "en-GB",
                    { day: "2-digit", month: "short", year: "numeric" },
                  ),
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-zinc-500">{label}</span>
                  <span className="text-zinc-800">{value}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Slug</span>
                <span className="font-mono text-xs text-zinc-600 truncate max-w-[140px]">
                  {trend.slug}
                </span>
              </div>
            </div>
          )}

          {mode === "create" && !savedId && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <p className="text-xs font-semibold text-amber-700 mb-1">
                Publishing
              </p>
              <p className="text-xs text-amber-600 leading-relaxed">
                Save as draft first. You can publish once the article is saved.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-zinc-100 p-6 max-w-sm w-full shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <TriangleAlert className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-zinc-900">Delete article?</p>
                <p className="text-sm text-zinc-400">This cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm bg-zinc-50 rounded-xl px-4 py-3 font-medium text-zinc-700 truncate">
              {trend?.title}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 px-4 py-2 text-sm border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
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
