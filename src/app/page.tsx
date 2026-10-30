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
      className="relative flex min-h-dvh flex-col overflow-hidden bg-[#0b1220] text-slate-100"
    >
      <Toaster position="top-right" richColors />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_75%_15%,rgba(22,163,74,0.12),transparent_35%)]"
      />

      <div className="relative flex w-full flex-1 items-center justify-center px-4 py-3 sm:px-6 sm:py-4">
        <div className="auth-layout relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-[#111c30] shadow-2xl shadow-black/20 lg:max-w-5xl">
          <section className="auth-brand flex-col justify-between border-b border-slate-800 p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-400 ring-1 ring-inset ring-green-500/20">
                <Server className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold tracking-[0.12em] text-white">TOUBA GAZ IT</p>
                <p className="mt-0.5 text-xs text-slate-400">Gestion du parc informatique</p>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-center py-5 lg:py-6">
              <Image
                src="/it-workspace.svg"
                alt="Illustration d’un ordinateur portable relié à un serveur et à des équipements informatiques"
                width={720}
                height={540}
                priority
                className="h-auto w-full max-w-[460px]"
              />
            </div>
          </section>

          <section className="auth-panel flex flex-col justify-center p-5 sm:p-7 lg:p-10">
            <div className="mb-6 flex items-center gap-2.5 lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10 text-green-400">
                <Server className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-sm font-bold tracking-[0.1em] text-white">TOUBA GAZ IT</span>
            </div>
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-green-400">
                Accès au portail
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                Connectez-vous
              </h2>
              <p className="mt-2 text-sm leading-5 text-slate-400">
                Utilisez votre adresse professionnelle pour accéder à votre espace.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="login-email" className="text-sm font-medium text-slate-200">
                  Adresse e-mail
                </label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
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
                    className="h-10 w-full rounded-lg border border-slate-700 bg-[#0b1220] pl-10 pr-3 text-base text-white outline-none transition-colors placeholder:text-slate-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 sm:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="login-password" className="text-sm font-medium text-slate-200">
                  Mot de passe
                </label>
                <div className="relative">
                  <LockKeyhole
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
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
                    className="h-10 w-full rounded-lg border border-slate-700 bg-[#0b1220] pl-10 pr-12 text-base text-white outline-none transition-colors placeholder:text-slate-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
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
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-green-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111c30] disabled:opacity-60"
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

            <p className="mt-3 text-center text-xs leading-4 text-slate-500">
              Accès démo : <span className="text-slate-400">admin@toubagaz.sn</span> (Admin) ou <span className="text-slate-400">abisene@toubagaz.sn</span> (Collaborateur).
            </p>
          </section>
        </div>
      </div>
      <footer className="relative w-full border-t border-slate-800/80 bg-[#0e1828]/90 px-4 py-3 text-center text-xs text-slate-400">
        © 2026 Touba Gaz SA · Direction des systèmes d’information
      </footer>
    </main>
  );
}
