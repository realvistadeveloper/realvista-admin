"use client";

// app/(dashboard)/learn/[id]/learn-detail-client.tsx
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateLearnAction, deleteLearnAction } from "../actions";
import type { LearnResource } from "../types";
import {
  ArrowLeft,
  Save,
  Trash2,
  Loader2,
  X,
  Check,
  Play,
  Eye,
  TriangleAlert,
} from "lucide-react";
import { clsx } from "clsx";

const CATEGORIES = ["Real Estate", "Finance", "Investment"] as const;

function getYouTubeId(url: string) {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? null;
}

const inputCls = (err?: string) =>
  clsx(
    "w-full text-sm border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-300",
    err ? "border-red-300 bg-red-50" : "border-zinc-200 bg-white",
  );

export default function LearnDetailClient({
  resource,
}: {
  resource: LearnResource;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(resource.title);
  const [description, setDescription] = useState(resource.description);
  const [category, setCategory] = useState(resource.category);
  const [youtubeUrl, setYoutubeUrl] = useState(resource.youtube_url);
  const [duration, setDuration] = useState(resource.duration ?? "");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  // Live preview — uses entered URL first, falls back to saved thumbnail
  const previewId = getYouTubeId(youtubeUrl) ?? resource.youtube_id;
  const thumbUrl = previewId
    ? `https://img.youtube.com/vi/${previewId}/maxresdefault.jpg`
    : resource.thumbnail_url;

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Title is required.";
    if (!description.trim()) e.description = "Description is required.";
    if (!youtubeUrl.trim()) e.youtubeUrl = "YouTube URL is required.";
    else if (!getYouTubeId(youtubeUrl)) e.youtubeUrl = "Invalid YouTube URL.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    startTransition(async () => {
      try {
        await updateLearnAction(resource.id, {
          title: title.trim(),
          description: description.trim(),
          category,
          youtube_url: youtubeUrl.trim(),
          duration: duration.trim() || null,
        });
        showFeedback("success", "Resource updated.");
      } catch (err: unknown) {
        showFeedback(
          "error",
          err instanceof Error ? err.message : "Failed to save.",
        );
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteLearnAction(resource.id);
      } catch {
        showFeedback("error", "Failed to delete.");
        setShowDelete(false);
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          href="/learn"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to learn
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save changes
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
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

      {/* Stats bar */}
      <div className="bg-white rounded-2xl border border-zinc-100 px-5 py-3 flex items-center gap-6">
        <span className="flex items-center gap-1.5 text-sm text-zinc-500">
          <Eye className="w-3.5 h-3.5" />
          <span className="font-semibold text-zinc-900">
            {resource.view_count.toLocaleString()}
          </span>{" "}
          views
        </span>
        <span className="text-xs text-zinc-400">
          Added{" "}
          {new Date(resource.created_at).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
        <span className="font-mono text-xs text-zinc-400 ml-auto truncate max-w-[160px]">
          {resource.slug}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5 items-start">
        {/* Main form */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-4">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Edit resource
          </p>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors((p) => ({ ...p, title: "" }));
              }}
              className={inputCls(errors.title)}
            />
            {errors.title && (
              <p className="text-xs text-red-500">{errors.title}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setErrors((p) => ({ ...p, description: "" }));
              }}
              rows={4}
              className={clsx(inputCls(errors.description), "resize-none")}
            />
            {errors.description && (
              <p className="text-xs text-red-500">{errors.description}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500">
              YouTube URL <span className="text-red-400">*</span>
            </label>
            <input
              value={youtubeUrl}
              onChange={(e) => {
                setYoutubeUrl(e.target.value);
                setErrors((p) => ({ ...p, youtubeUrl: "" }));
              }}
              placeholder="https://youtube.com/watch?v=..."
              className={inputCls(errors.youtubeUrl)}
            />
            {errors.youtubeUrl && (
              <p className="text-xs text-red-500">{errors.youtubeUrl}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-500">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as typeof category)}
                className={inputCls()}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-500">
                Duration
              </label>
              <input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 12:45"
                className={inputCls()}
              />
            </div>
          </div>
        </div>

        {/* Sidebar — thumbnail + embed */}
        <div className="space-y-4 lg:sticky lg:top-6">
          {thumbUrl && (
            <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
              <img
                src={thumbUrl}
                alt={title}
                className="w-full aspect-video object-cover"
              />
            </div>
          )}

          {previewId && (
            <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-4 pt-4 pb-2">
                Preview
              </p>
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${previewId}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>
          )}

          {!previewId && !thumbUrl && (
            <div className="bg-white rounded-2xl border border-zinc-100 p-8 flex flex-col items-center text-center text-zinc-400">
              <Play className="w-8 h-8 text-zinc-200 mb-2" />
              <p className="text-sm">Enter a YouTube URL to see a preview</p>
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
                <p className="font-semibold text-zinc-900">Delete resource?</p>
                <p className="text-sm text-zinc-400">This cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm bg-zinc-50 rounded-xl px-4 py-3 font-medium text-zinc-700 truncate">
              {resource.title}
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
