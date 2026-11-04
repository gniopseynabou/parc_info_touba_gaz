import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import crypto from "crypto";

export interface CreateNotificationParams {
  userId: string;
  ticketId?: string | null;
  titre: string;
  message: string;
  type?: string;
}

/**
 * Crée une notification pour un utilisateur spécifique
 */
export async function createNotification({
  userId,
  ticketId = null,
  titre,
  message,
  type = "ticket",
}: CreateNotificationParams): Promise<string> {
  const id = `notif-${crypto.randomUUID().slice(0, 8)}`;
  
  await pool.query<ResultSetHeader>(
    `INSERT INTO notifications (id, user_id, ticket_id, titre, message, type, lu, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, NOW())`,
    [id, userId, ticketId, titre, message, type]
  );

  return id;
}

/**
 * Notifie tous les administrateurs IT actifs
 */
export async function notifyAdmins({
  ticketId = null,
  titre,
  message,
  type = "ticket",
  excludeUserId,
}: {
  ticketId?: string | null;
  titre: string;
  message: string;
  type?: string;
  excludeUserId?: string;
}) {
  const [admins] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM utilisateurs WHERE role = 'admin' AND actif = 1`
  );

  for (const admin of admins) {
    if (excludeUserId && admin.id === excludeUserId) continue;
    await createNotification({
      userId: admin.id,
      ticketId,
      titre,
      message,
      type,
    });
  }
}

/**
 * Notifie l'employé lié au demandeur_id d'un ticket
 * (Désactivé conformément à la règle 10 : suppression complète des notifications pour l'espace collaborateur)
 */
export async function notifyTicketDemandeur({
  demandeurId,
  ticketId,
  titre,
  message,
  type = "ticket",
  excludeUserId,
}: {
  demandeurId: string;
  ticketId: string;
  titre: string;
  message: string;
  type?: string;
  excludeUserId?: string;
}) {
  // Supprimé pour l'espace collaborateur : les notifications sont réservées exclusivement à l'administrateur IT
  return;
}
