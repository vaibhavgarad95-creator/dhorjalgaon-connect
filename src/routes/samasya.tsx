import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, MapPin, ShieldQuestion } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { CATEGORIES, VILLAGES } from "@/lib/gp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/samasya")({
  head: () => ({
    meta: [
      { title: "समस्या नोंदवा | ग्रामपंचायत ढोरजळगाव" },
      {
        name: "description",
        content: "पाणी, रस्ते, वीज, स्वच्छता अशा गावातील समस्या छायाचित्रासह ग्रामपंचायतीकडे नोंदवा.",
      },
      { property: "og:title", content: "समस्या नोंदवा | ग्रामपंचायत ढोरजळगाव" },
      { property: "og:description", content: "छायाचित्र व स्थळासह समस्या नोंदवा – गुप्त नोंदणीचा पर्याय." },
    ],
  }),
  component: SamasyaPage,
});

const schema = z.object({
  title: z.string().trim().min(4, "समस्येचे शीर्षक लिहा").max(120),
  description: z.string().trim().max(1000),
  category: z.string().min(1, "प्रकार निवडा"),
  village: z.string().min(1),
});

function SamasyaPage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [anonymous, setAnonymous] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    village: "",
    location_text: "",
  });

  const village = form.village || profile?.village || VILLAGES[0].name;
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function pickPhoto(f: File | null) {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  function detectLocation() {
    if (!("geolocation" in navigator)) {
      toast.error("या उपकरणावर स्थळ शोधता येत नाही");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success("स्थळ नोंदवले गेले");
      },
      () => toast.error("स्थळ मिळाले नाही. कृपया परवानगी द्या."),
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({ ...form, village });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "माहिती तपासा");
      return;
    }
    setBusy(true);
    try {
      let photoPath: string | null = null;
      if (file) {
        if (file.size > 8 * 1024 * 1024) throw new Error("छायाचित्र ८ MB पेक्षा लहान असावे");
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("issue-photos").upload(path, file);
        if (upErr) throw upErr;
        photoPath = path;
      }

      const { error } = await supabase.from("issues").insert({
        title: parsed.data.title,
        description: parsed.data.description,
        category: parsed.data.category,
        village: parsed.data.village,
        photo_url: photoPath,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        location_text: form.location_text.trim().slice(0, 200) || null,
        is_anonymous: anonymous,
        reporter_id: user.id,
      });
      if (error) throw error;
      toast.success("आपली समस्या यशस्वीरित्या नोंदवली गेली");
      void navigate({ to: "/sthiti" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "नोंद करता आली नाही");
    } finally {
      setBusy(false);
    }
  }

  if (!loading && !user) {
    return (
      <AppShell>
        <div className="gp-card p-6 text-center">
          <h1 className="text-xl font-bold text-foreground">समस्या नोंदवा</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            समस्या नोंदवण्यासाठी कृपया प्रवेश करा. आपली ओळख सुरक्षित ठेवली जाते.
          </p>
          <Link
            to="/pravesh"
            className="mt-5 inline-flex h-12 items-center rounded-md bg-primary px-6 font-semibold text-primary-foreground"
          >
            प्रवेश करा
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-foreground">समस्या नोंदवा</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        गावातील अडचण ग्रामपंचायतीपर्यंत थेट पोहोचवा.
      </p>

      <form onSubmit={onSubmit} className="mt-5 space-y-5 gp-card p-5">
        <div>
          <Label htmlFor="category">समस्येचा प्रकार *</Label>
          <select
            id="category"
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            className="mt-1 h-12 w-full rounded-md border border-input bg-background px-3 text-base"
          >
            <option value="">— निवडा —</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="village">गाव *</Label>
          <select
            id="village"
            value={village}
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

        <div>
          <Label htmlFor="title">समस्येचे शीर्षक *</Label>
          <Input
            id="title"
            value={form.title}
            maxLength={120}
            onChange={(e) => set("title", e.target.value)}
            placeholder="उदा. मुख्य रस्त्यावर मोठा खड्डा"
            className="mt-1 h-12 text-base"
          />
        </div>

        <div>
          <Label htmlFor="description">सविस्तर माहिती</Label>
          <Textarea
            id="description"
            value={form.description}
            maxLength={1000}
            onChange={(e) => set("description", e.target.value)}
            rows={4}
            className="mt-1 text-base"
          />
        </div>

        <div>
          <Label htmlFor="photo" className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-brand" /> छायाचित्र (कॅमेरा / गॅलरी)
          </Label>
          <Input
            id="photo"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => pickPhoto(e.target.files?.[0] ?? null)}
            className="mt-1 h-12 py-2.5 text-sm"
          />
          {preview && <img src={preview} alt="निवडलेले छायाचित्र" className="mt-3 h-44 w-full rounded-lg object-cover" />}
        </div>

        <div>
          <Label htmlFor="location_text" className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-brand" /> ठिकाण
          </Label>
          <Input
            id="location_text"
            value={form.location_text}
            maxLength={200}
            onChange={(e) => set("location_text", e.target.value)}
            placeholder="उदा. हनुमान मंदिराजवळ"
            className="mt-1 h-12 text-base"
          />
          <Button type="button" variant="secondary" onClick={detectLocation} className="mt-2 h-11 w-full">
            {coords ? "स्थळ नोंदवले ✓" : "सध्याचे स्थळ जोडा"}
          </Button>
        </div>

        <div className="flex items-start justify-between gap-4 rounded-xl bg-secondary p-4">
          <div>
            <p className="flex items-center gap-2 font-semibold text-secondary-foreground">
              <ShieldQuestion className="h-5 w-5" /> गुप्तपणे नोंदवा
            </p>
            <p className="mt-1 text-xs text-muted-foreground">आपले नाव इतर ग्रामस्थांना दिसणार नाही.</p>
          </div>
          <Switch checked={anonymous} onCheckedChange={setAnonymous} aria-label="गुप्तपणे नोंदवा" />
        </div>

        <Button type="submit" disabled={busy} className="h-13 w-full py-3.5 text-base font-bold">
          {busy ? "पाठवत आहे..." : "समस्या पाठवा"}
        </Button>
      </form>
    </AppShell>
  );
}