"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Server,
  Loader2,
  Flame,
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export default function LoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password) {
      toast.error("Veuillez renseigner votre adresse e-mail et votre mot de passe.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Bienvenue ${data.user.nom} !`);
        if (typeof window !== "undefined") {
          localStorage.setItem("touba_gaz_user", JSON.stringify(data.user));
        }
        router.push(data.redirectTo || "/dashboard");
      } else {
        toast.error(data.message || "Identifiants invalides.");
      }
    } catch {
      toast.error("Erreur de connexion au serveur.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      suppressHydrationWarning
      className="relative flex min-h-dvh flex-col justify-between bg-[#F8FAFC] text-[#17231B]"
    >
      <Toaster position="top-right" richColors />

      {/* Halo très discret en arrière-plan */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(22,163,74,0.05),transparent_40%)]"
      />

      <div className="relative flex w-full flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="auth-layout relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 lg:max-w-5xl">
          {/* Panneau gauche : Présentation Touba Gaz */}
          <section className="auth-brand flex flex-col justify-between border-b border-slate-200 bg-white p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60 shadow-2xs">
                <Flame className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold tracking-[0.1em] text-slate-900">TOUBA GAZ</p>
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                    IT
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">Gestion du parc informatique</p>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-center py-6 lg:py-8">
              <Image
                src="/it-workspace.svg"
                alt="Illustration du parc informatique Touba Gaz"
                width={720}
                height={540}
                priority
                className="h-auto w-full max-w-[420px]"
              />
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
              <p className="text-xs font-semibold text-slate-800">Système centralisé</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Inventaire du matériel, gestion des affectations et résolution des demandes d'assistance.
              </p>
            </div>
          </section>

          {/* Panneau droit : Formulaire de connexion */}
          <section className="auth-panel flex flex-col justify-center p-6 sm:p-8 lg:p-10">
            <div className="mb-6 flex items-center gap-2.5 lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50">
                <Flame className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-sm font-bold tracking-[0.1em] text-slate-900">TOUBA GAZ IT</span>
            </div>

            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-600">
                Accès au portail
              </p>
              <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
                Connectez-vous
              </h2>
              <p className="mt-1.5 text-sm text-slate-500">
                Utilisez votre adresse professionnelle pour accéder à votre espace de travail.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="login-email" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Adresse e-mail
                </label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="prenom.nom@toubagaz.sn"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="login-password" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Mot de passe
                </label>
                <div className="relative">
                  <LockKeyhole
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="Saisissez votre mot de passe"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-12 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-60 shadow-xs cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    Se connecter
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs leading-5 text-slate-600">
              <span className="font-semibold text-slate-800">Comptes de démonstration :</span>
              <ul className="mt-1 space-y-0.5 text-slate-600">
                <li>• Admin IT : <code className="text-slate-800 font-medium">admin@toubagaz.sn</code></li>
                <li>• Collaborateur : <code className="text-slate-800 font-medium">abisene@toubagaz.sn</code></li>
              </ul>
            </div>
          </section>
        </div>
      </div>

      <footer className="relative w-full border-t border-slate-200 bg-white px-4 py-3 text-center text-xs text-slate-500">
        © 2026 Touba Gaz SA · Direction des Systèmes d’Information
      </footer>
    </main>
  );
}
