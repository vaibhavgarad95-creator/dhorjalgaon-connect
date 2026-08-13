import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { VILLAGES, GRAM_PANCHAYAT, TALUKA, DISTRICT } from "@/lib/gp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/pravesh")({
  head: () => ({
    meta: [
      { title: "प्रवेश करा | ग्रामपंचायत ढोरजळगाव" },
      { name: "description", content: "ढोरजळगाव ग्रामपंचायत अ‍ॅपमध्ये नोंदणी करा किंवा प्रवेश करा." },
      { property: "og:title", content: "प्रवेश करा | ग्रामपंचायत ढोरजळगाव" },
      { property: "og:description", content: "ग्रामस्थ व प्रशासन यांच्यासाठी सुरक्षित प्रवेश." },
    ],
  }),
  component: PraveshPage,
});

const signUpSchema = z.object({
  full_name: z.string().trim().min(2, "पूर्ण नाव लिहा").max(80),
  email: z.string().trim().email("ई-मेल चुकीचा आहे").max(255),
  password: z.string().min(6, "पासवर्ड किमान ६ अक्षरांचा हवा").max(72),
  phone: z.string().trim().max(15).optional(),
  village: z.string().min(1),
});

function PraveshPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    village: VILLAGES[0].name as string,
  });

  useEffect(() => {
    if (!loading && user) void navigate({ to: "/" });
  }, [user, loading, navigate]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const parsed = signUpSchema.safeParse(form);
        if (!parsed.success) {
          toast.error(parsed.error.issues[0]?.message ?? "माहिती तपासा");
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: parsed.data.full_name,
              phone: parsed.data.phone,
              village: parsed.data.village,
            },
          },
        });
        if (error) throw error;
        toast.success("नोंदणी यशस्वी! आता प्रवेश करू शकता.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (error) throw error;
        toast.success("स्वागत आहे!");
        void navigate({ to: "/" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "काहीतरी चूक झाली";
      toast.error(
        message.includes("Invalid login credentials")
          ? "ई-मेल किंवा पासवर्ड चुकीचा आहे"
          : message.includes("already registered")
            ? "हा ई-मेल आधीच नोंदवलेला आहे"
            : message,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col gp-surface">
      <div className="mx-auto w-full max-w-md flex-1 px-4 py-10">
        <div className="text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
            ग्रा
          </span>
          <h1 className="mt-4 text-2xl font-bold text-foreground">{GRAM_PANCHAYAT}</h1>
          <p className="text-sm text-muted-foreground">
            ता. {TALUKA}, जि. {DISTRICT}
          </p>
        </div>

        <div className="mt-6 gp-card p-5">
          <div className="mb-5 grid grid-cols-2 gap-2 rounded-full bg-secondary p-1">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-full py-2 text-sm font-semibold transition-colors ${
                  mode === m ? "bg-primary text-primary-foreground" : "text-secondary-foreground"
                }`}
              >
                {m === "login" ? "प्रवेश" : "नवीन नोंदणी"}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <Label htmlFor="full_name">पूर्ण नाव</Label>
                  <Input
                    id="full_name"
                    value={form.full_name}
                    onChange={(e) => set("full_name", e.target.value)}
                    maxLength={80}
                    className="mt-1 h-12 text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">मोबाईल क्रमांक (ऐच्छिक)</Label>
                  <Input
                    id="phone"
                    inputMode="numeric"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    maxLength={15}
                    className="mt-1 h-12 text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="village">आपले गाव</Label>
                  <select
                    id="village"
                    value={form.village}
                    onChange={(e) => set("village", e.target.value)}
                    className="mt-1 h-12 w-full rounded-md border border-input bg-background px-3 text-base"
                  >
                    {VILLAGES.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <div>
              <Label htmlFor="email">ई-मेल</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className="mt-1 h-12 text-base"
              />
            </div>
            <div>
              <Label htmlFor="password">पासवर्ड</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                className="mt-1 h-12 text-base"
              />
            </div>

            <Button type="submit" disabled={busy} className="h-12 w-full text-base font-semibold">
              {busy ? "थांबा..." : mode === "login" ? "प्रवेश करा" : "नोंदणी करा"}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            प्रशासन विभाग फक्त ग्रामपंचायत अधिकाऱ्यांसाठी सुरक्षित आहे.
          </p>
        </div>

        <div className="mt-5 text-center">
          <Link to="/" className="text-sm font-medium text-primary underline underline-offset-4">
            प्रवेशाशिवाय माहिती पहा
          </Link>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}