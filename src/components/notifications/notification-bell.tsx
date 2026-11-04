"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
  LifeBuoy,
  Loader2,
  Inbox,
} from "lucide-react";
import { formatDateFr } from "@/lib/constants";
import { toast } from "sonner";

interface NotificationItem {
  id: string;
  ticket_id: string | null;
  titre: string;
  message: string;
  type: string;
  lu: number;
  created_at: string;
  ticket_numero?: number;
  ticket_statut?: string;
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Charger le nombre de notifications et les éléments récents
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications?limit=15");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Actualisation périodique automatique toutes les 25 secondes
    const interval = setInterval(fetchNotifications, 25000);
    return () => clearInterval(interval);
  }, []);

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Marquer une notification comme lue
  const handleMarkAsRead = async (notifId: string, ticketId?: string | null) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notifId }),
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, lu: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      if (ticketId) {
        setOpen(false);
        router.push("/dashboard/tickets");
      }
    } catch {
      toast.error("Impossible de marquer comme lue.");
    }
  };

  // Marquer tout comme lu
  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, lu: 1 })));
      setUnreadCount(0);
      toast.success("Toutes les notifications sont marquées comme lues.");
    } catch {
      toast.error("Erreur lors de la mise à jour.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton cloche avec badge dynamique */}
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) fetchNotifications();
        }}
        className="relative flex size-9 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none"
        aria-label="Notifications"
        title="Notifications et alertes"
      >
        <Bell className="size-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Volet déroulant des notifications */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-0 shadow-xl z-50 animate-in fade-in-0 zoom-in-95">
          {/* En-tête du volet */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
              >
                <CheckCheck className="size-3.5" />
                <span>Tout marquer comme lu</span>
              </button>
            )}
          </div>

          {/* Corps de la liste des notifications */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-2">
                  <Inbox className="size-5" />
                </div>
                <p className="text-xs font-medium text-slate-700">Aucune notification</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Vous serez notifié dès qu'un nouvel événement survient.
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const isUnread = item.lu === 0;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleMarkAsRead(item.id, item.ticket_id)}
                    className={`flex items-start gap-3 p-3.5 transition-colors cursor-pointer ${
                      isUnread
                        ? "bg-emerald-50/40 hover:bg-emerald-50/70"
                        : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-xl mt-0.5 ${
                        isUnread
                          ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300/50"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <LifeBuoy className="size-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p
                          className={`text-xs truncate ${
                            isUnread
                              ? "font-bold text-slate-900"
                              : "font-semibold text-slate-700"
                          }`}
                        >
                          {item.titre}
                        </p>
                        {isUnread && (
                          <span className="size-2 rounded-full bg-emerald-600 shrink-0" />
                        )}
                      </div>

                      <p className="mt-0.5 text-xs text-slate-600 leading-snug line-clamp-2">
                        {item.message}
                      </p>

                      <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatDateFr(item.created_at)}
                        </span>
                        {item.ticket_id && (
                          <span className="font-semibold text-emerald-700 flex items-center gap-0.5">
                            Voir le ticket
                            <ExternalLink className="size-2.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pied du volet */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-100 p-2.5 text-center bg-slate-50/50 rounded-b-2xl">
              <Link
                href="/dashboard/tickets"
                onClick={() => setOpen(false)}
                className="text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
              >
                Accéder au suivi des tickets d'assistance →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
