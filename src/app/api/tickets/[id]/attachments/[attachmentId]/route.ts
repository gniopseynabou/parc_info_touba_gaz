import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { getStoredTicketPhotoPath } from "@/lib/ticket-attachments";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const authResult = await requireAuth(req);
    if ("errorResponse" in authResult) return authResult.errorResponse;
    const { id, attachmentId } = await params;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT a.storage_key, a.mime_type
       FROM ticket_attachments a
       JOIN tickets t ON t.id = a.ticket_id
       WHERE a.id = ? AND a.ticket_id = ? AND (? = 'admin' OR t.demandeur_id = ?)`,
      [attachmentId, id, authResult.user.role, authResult.user.employe_id || authResult.user.id]
    );
    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: "Photo introuvable ou accès refusé." }, { status: 404 });
    }

    const photo = rows[0];
    if (!["image/jpeg", "image/png", "image/webp"].includes(photo.mime_type)) {
      return NextResponse.json({ success: false, message: "Type de photo non autorisé." }, { status: 415 });
    }
    const image = await readFile(getStoredTicketPhotoPath(id, photo.storage_key));
    return new Response(new Uint8Array(image), {
      headers: {
        "Content-Type": photo.mime_type,
        "Content-Length": String(image.byteLength),
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=86400",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; img-src 'self' data:;",
      },
    });
  } catch (error) {
    console.error("Erreur GET photo de ticket:", error);
    return NextResponse.json({ success: false, message: "Impossible de charger cette photo." }, { status: 500 });
  }
}
