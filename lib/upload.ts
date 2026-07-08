// lib/upload.ts
// Direct browser → Django upload, bypasses Next.js Server Action body limit.

export async function uploadTrendImage(
  trendId: number,
  file: File,
  imageType: "cover" | "inline",
  accessToken: string,
): Promise<{ url?: string; cover_url?: string }> {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!base) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set. Add it to your .env.local file.\n" +
        "Example: NEXT_PUBLIC_API_URL=http://127.0.0.1:8001",
    );
  }

  const formData = new FormData();
  formData.append("image", file);
  formData.append("type", imageType);

  const res = await fetch(`${base}/api/admin/trends/${trendId}/upload-image/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });

  if (!res.ok) {
    let message = `Upload failed (${res.status})`;
    try {
      const err = await res.json();
      if (err.detail) message = err.detail;
    } catch {
      /* ignore parse error */
    }
    throw new Error(message);
  }

  return res.json();
}
