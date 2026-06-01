import { NextResponse } from "next/server";
import { requireActiveMembership } from "@/lib/auth/session";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  try {
    const ctx = await requireActiveMembership();
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: "Cloudinary non configuré" }, { status: 503 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const contentType = formData.get("contentType") as string;
    const contentId = formData.get("contentId") as string;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Type non autorisé" }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Fichier trop volumineux (5 Mo max)" }, { status: 400 });
    }

    const communeId = ctx.activeMembership!.commune_id;
    const folder = `app-mairies/${communeId}/${contentType}/${contentId}`;
    const timestamp = Math.floor(Date.now() / 1000);

    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-1", encoder.encode(paramsToSign));
    const signature = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const uploadForm = new FormData();
    uploadForm.append("file", file);
    uploadForm.append("api_key", apiKey);
    uploadForm.append("timestamp", String(timestamp));
    uploadForm.append("signature", signature);
    uploadForm.append("folder", folder);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: uploadForm },
    );

    if (!uploadRes.ok) {
      return NextResponse.json({ error: "Échec upload Cloudinary" }, { status: 502 });
    }

    const payload = (await uploadRes.json()) as { secure_url?: string };
    return NextResponse.json({ url: payload.secure_url ?? null });
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
}
