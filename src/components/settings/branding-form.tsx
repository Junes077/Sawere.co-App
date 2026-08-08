"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2, Upload, Building2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import type { Firm } from "@prisma/client";

const BRANDING_BUCKET = "branding";

function UploadSlot({
  label,
  description,
  currentUrl,
  firmId,
  field,
  aspect,
  onUploaded,
}: {
  label: string;
  description: string;
  currentUrl: string | null;
  firmId: string;
  field: "logoUrl" | "officePhotoUrl";
  aspect: "square" | "wide";
  onUploaded: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const supabase = createClient();
      const prefix = field === "logoUrl" ? "logo" : "office";
      const path = `${firmId}/${prefix}-${crypto.randomUUID()}-${file.name}`;

      const { error: uploadError } = await supabase.storage.from(BRANDING_BUCKET).upload(path, file, {
        upsert: true,
      });
      if (uploadError) throw new Error(uploadError.message);

      const { data } = supabase.storage.from(BRANDING_BUCKET).getPublicUrl(path);

      const res = await fetch("/api/settings/branding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: data.publicUrl }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Couldn't save the image");
      }

      toast.success(`${label} updated`);
      onUploaded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div>
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      <div
        className={
          aspect === "square"
            ? "flex size-24 items-center justify-center overflow-hidden rounded-lg bg-secondary"
            : "flex aspect-video w-full max-w-sm items-center justify-center overflow-hidden rounded-lg bg-secondary"
        }
      >
        {currentUrl ? (
          <Image
            src={currentUrl}
            alt={label}
            width={aspect === "square" ? 96 : 400}
            height={aspect === "square" ? 96 : 225}
            className="size-full object-cover"
            unoptimized
          />
        ) : field === "logoUrl" ? (
          <Building2 className="size-8 text-muted-foreground" />
        ) : (
          <ImageIcon className="size-8 text-muted-foreground" />
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <Button
        variant="outline"
        size="sm"
        className="w-fit"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
        {currentUrl ? "Replace" : "Upload"}
      </Button>
    </div>
  );
}

export function BrandingForm({ firm }: { firm: Firm }) {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding</CardTitle>
        <CardDescription>
          Your logo appears throughout the app; the office photo is used on your public-facing
          pages once those go live.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row">
        <UploadSlot
          label="Firm logo"
          description="Square image works best (e.g. 512×512px)."
          currentUrl={firm.logoUrl}
          firmId={firm.id}
          field="logoUrl"
          aspect="square"
          onUploaded={() => router.refresh()}
        />
        <UploadSlot
          label="Office photo"
          description="A landscape photo of your office."
          currentUrl={firm.officePhotoUrl}
          firmId={firm.id}
          field="officePhotoUrl"
          aspect="wide"
          onUploaded={() => router.refresh()}
        />
      </CardContent>
    </Card>
  );
}
