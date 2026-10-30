import { Shell } from "@/components/layout/shell";

export const metadata = {
  title: "Tableau de Bord — Touba Gaz IT",
  description: "Gestion du parc informatique et suivi des demandes d'assistance Touba Gaz",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Shell>{children}</Shell>;
}
