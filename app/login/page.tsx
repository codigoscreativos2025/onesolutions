"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/locale-context";
import { Mail, Lock, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { t } = useLocale();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/ranking",
    });

    if (result?.error) {
      setError(t.login.error);
      setLoading(false);
    } else {
      const session = await getSession();
      if (session?.user?.role === "PARTNER") {
        router.push("/leads");
      } else {
        router.push("/ranking");
      }
      router.refresh();
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 circuit-bg pointer-events-none" />

      <div className="w-full max-w-md glass-panel rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4">
            <svg viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg" className="w-24 h-32 mx-auto">
              <polygon points="30,100 150,30 270,100 270,120 150,50 30,120" fill="#f48221"/>
              <polygon points="210,115 235,95 255,115 230,135" fill="#1d1d1b"/>
              <circle cx="150" cy="180" r="65" fill="none" stroke="#1d1d1b" strokeWidth="18"/>
              <text x="150" y="228" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="130" textAnchor="middle" fill="#1d1d1b">S</text>
              <g fill="#f48221">
                <text x="150" y="325" fontFamily="Arial Black,Impact,sans-serif" fontWeight="900" fontSize="95" textAnchor="middle" letterSpacing="1">ONE</text>
                <rect x="73" y="240" width="6" height="90" fill="#ffffff"/>
                <rect x="135" y="240" width="6" height="90" fill="#ffffff" transform="skewX(-25)"/>
                <rect x="228" y="240" width="8" height="90" fill="#ffffff"/>
              </g>
              <text x="150" y="375" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="36" textAnchor="middle" fill="#000000" letterSpacing="2">SOLUTIONS</text>
            </svg>
          </div>
          <h1 className="font-display text-3xl font-bold text-on-surface">
            One Solutions
          </h1>
          <p className="text-on-surface-variant mt-2">Bienvenido</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">
              {t.login.email}
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface"
                placeholder="admin@onesolutions.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">
              {t.login.password}
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface"
                placeholder="••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-error-container text-on-error-container text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-primary text-on-primary rounded-xl font-bold text-lg shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t.login.submit}
          </button>
        </form>
      </div>
    </main>
  );
}
