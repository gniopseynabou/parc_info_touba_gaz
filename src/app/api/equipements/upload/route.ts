import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { requireAuth } from "@/lib/auth";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

function detectMimeType(buffer: Buffer): string | null {
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length > 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    buffer.length > 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAuth(req, ["admin"]);
    if ("errorResponse" in authResult) {
      return authResult.errorResponse;
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: "Aucun fichier reçu." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: "L'image ne doit pas dépasser 5 Mo." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = detectMimeType(buffer);

    if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { success: false, message: "Format non accepté. Formats autorisés : JPG, PNG, WEBP." },
        { status: 400 }
      );
    }

    let ext = "jpg";
    if (mimeType === "image/png") ext = "png";
    if (mimeType === "image/webp") ext = "webp";

    const fileName = `eq-${crypto.randomUUID().slice(0, 12)}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "equipements");
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/equipements/${fileName}`;

    return NextResponse.json({
      success: true,
      message: "Photo téléversée avec succès.",
      photoUrl: publicUrl,
    });
  } catch (error) {
    console.error("Erreur upload photo équipement:", error);
    return NextResponse.json({ success: false, message: "Erreur serveur lors du téléversement." }, { status: 500 });
  }
}
