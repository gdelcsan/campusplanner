import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Paintbrush } from "lucide-react";

function hexToHslString(hex: string): string {
  let r = 0, g = 0, b = 0;
  const clean = hex.replace("#", "");
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  } else if (clean.length === 6) {
    r = parseInt(clean.slice(0, 2), 16);
    g = parseInt(clean.slice(2, 4), 16);
    b = parseInt(clean.slice(4, 6), 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  const H = Math.round(h * 360);
  const S = Math.round(s * 100);
  const L = Math.round(l * 100);
  return `${H} ${S}% ${L}%`;
}

const vars = [
  { key: "--primary", label: "Primary", defaultHex: "#6366F1" },
  { key: "--secondary", label: "Secondary", defaultHex: "#06B6D4" },
  { key: "--accent", label: "Accent", defaultHex: "#10B981" },
] as const;

type VarKey = (typeof vars)[number]["key"];

function getCurrentHexFromVar(key: VarKey): string | null {
  const computed = getComputedStyle(document.documentElement).getPropertyValue(key).trim();
  if (!computed) return null;
  // computed is like "222 47% 11%"; we cannot easily convert back to hex here; return null to use default
  return null;
}

export function ColorCustomizer() {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<VarKey, string>>({
    "--primary": "#6366F1",
    "--secondary": "#06B6D4",
    "--accent": "#10B981",
  });

  useEffect(() => {
    const saved = localStorage.getItem("custom-colors");
    if (saved) {
      try {
        const obj = JSON.parse(saved) as Record<VarKey, string>;
        setValues(obj);
        Object.entries(obj).forEach(([k, hex]) => {
          document.documentElement.style.setProperty(k, hexToHslString(hex));
        });
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("custom-colors", JSON.stringify(values));
  }, [values]);

  const reset = () => {
    const defaults: Record<VarKey, string> = {
      "--primary": "#6366F1",
      "--secondary": "#06B6D4",
      "--accent": "#10B981",
    };
    setValues(defaults);
    Object.entries(defaults).forEach(([k, hex]) => {
      document.documentElement.style.setProperty(k, hexToHslString(hex));
    });
  };

  const apply = () => {
    (Object.keys(values) as VarKey[]).forEach((k) => {
      document.documentElement.style.setProperty(k, hexToHslString(values[k]));
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="gap-2" aria-label="Customize colors">
          <Paintbrush /> Colors
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Customize theme colors</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
          {vars.map((v) => (
            <div key={v.key} className="space-y-2">
              <Label htmlFor={v.key}>{v.label}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id={v.key}
                  type="color"
                  value={values[v.key]}
                  onChange={(e) => setValues((s) => ({ ...s, [v.key]: e.target.value }))}
                  className="h-10 w-16 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={values[v.key]}
                  onChange={(e) => setValues((s) => ({ ...s, [v.key]: e.target.value }))}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between">
          <Button variant="ghost" onClick={reset}>Reset</Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={apply}>Apply</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
