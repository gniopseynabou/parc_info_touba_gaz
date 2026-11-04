import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const authResult = await requireAuth(req);
    if ("errorResponse" in authResult) {
      return authResult.errorResponse;
    }
    const session = authResult.user;
    const userId = session.id;

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") || 20), 50);
    const onlyUnread = searchParams.get("unread") === "true";

    // 1. Nombre total de non lues
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND lu = 0`,
      [userId]
    );
    const unreadCount = Number(countRows[0]?.unread_count || 0);

    // 2. Liste des notifications récentes
    let query = `
      SELECT n.id, n.ticket_id, n.titre, n.message, n.type, n.lu, n.created_at,
             t.numero as ticket_numero, t.statut as ticket_statut
      FROM notifications n
      LEFT JOIN tickets t ON t.id = n.ticket_id
      WHERE n.user_id = ?
    `;
    const params: (string | number)[] = [userId];

    if (onlyUnread) {
      query += ` AND n.lu = 0`;
    }

    query += ` ORDER BY n.created_at DESC LIMIT ?`;
    params.push(limit);

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    return NextResponse.json({
      success: true,
      unreadCount,
      notifications: rows,
    });
  } catch (error) {
    console.error("Erreur GET /api/notifications:", error);
    return NextResponse.json(
      { success: false, message: "Erreur lors de la récupération des notifications." },
      { status: 500 }
    );
  }
}

// Marquer une notification comme lue ou tout marquer comme lu
export async function PATCH(req: Request) {
  try {
    const authResult = await requireAuth(req);
    if ("errorResponse" in authResult) {
      return authResult.errorResponse;
    }
    const session = authResult.user;
    const userId = session.id;

    const body = await req.json();
    const { notificationId, markAllAsRead } = body;

    if (markAllAsRead) {
      await pool.query<ResultSetHeader>(
        `UPDATE notifications SET lu = 1 WHERE user_id = ? AND lu = 0`,
        [userId]
      );
      return NextResponse.json({
        success: true,
        message: "Toutes les notifications ont été marquées comme lues.",
      });
    }

    if (notificationId) {
      await pool.query<ResultSetHeader>(
        `UPDATE notifications SET lu = 1 WHERE id = ? AND user_id = ?`,
        [notificationId, userId]
      );
      return NextResponse.json({
        success: true,
        message: "Notification marquée comme lue.",
      });
    }

    return NextResponse.json(
      { success: false, message: "Action non spécifiée." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erreur PATCH /api/notifications:", error);
    return NextResponse.json(
      { success: false, message: "Erreur lors de la mise à jour des notifications." },
      { status: 500 }
    );
  }
}
