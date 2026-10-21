import fs from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { auth } from "@/auth";
import { loadInvoice } from "@/lib/invoice";
import { BUSINESS, businessExtras, businessPhone } from "@/lib/business";

export const runtime = "nodejs";

// The invoice drawn as a PNG (A4 proportions) to send as a picture on WhatsApp.
// Same design as /admin/invoice/[id]. Fonts come from @fontsource (.woff; satori
// cannot read woff2).

const W = 1240;
const H = 1754;
const C = { cream: "#ede5d6", oxblood: "#480903", muted: "#8a5a4f", burnt: "#b64b12" };

const fontFile = (pkg: string, file: string) => path.join(process.cwd(), "node_modules", "@fontsource", pkg, "files", file);
let fontCache: Awaited<ReturnType<typeof loadFonts>> | null = null;
async function loadFonts() {
  const read = (p: string) => fs.readFile(p);
  const [display, script, sans, sansMedium] = await Promise.all([
    read(fontFile("bodoni-moda", "bodoni-moda-latin-400-normal.woff")),
    read(fontFile("cormorant-garamond", "cormorant-garamond-latin-300-italic.woff")),
    read(fontFile("jost", "jost-latin-400-normal.woff")),
    read(fontFile("jost", "jost-latin-500-normal.woff")),
  ]);
  return [
    { name: "Display", data: display, weight: 400 as const, style: "normal" as const },
    { name: "Script", data: script, weight: 300 as const, style: "italic" as const },
    { name: "Sans", data: sans, weight: 400 as const, style: "normal" as const },
    { name: "Sans", data: sansMedium, weight: 500 as const, style: "normal" as const },
  ];
}

const caps = (size: number, extra: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: "Sans",
  fontSize: size,
  letterSpacing: size * 0.13,
  textTransform: "uppercase",
  ...extra,
});

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await auth())) return new Response("Unauthorized", { status: 401 });
  const { id } = await ctx.params;
  const inv = await loadInvoice(id);
  if (!inv) return new Response("Not found", { status: 404 });

  fontCache ??= await loadFonts();
  const logo = await fs.readFile(path.join(process.cwd(), "public", "brand", "logo-cream.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
  const phone = businessPhone();
  const extra = businessExtras();

  const line = (l: { label: string; amount: string; muted?: boolean }) => (
    <div key={l.label} style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", color: l.muted ? C.muted : C.oxblood, ...caps(24) }}>
      <span style={{ maxWidth: 640 }}>{l.label}</span>
      <span>{l.amount}</span>
    </div>
  );
  const ruleHead = (left: string, right: string, top = 0) => (
    <div style={{ display: "flex", alignItems: "center", marginTop: top, marginBottom: 26, ...caps(28) }}>
      <span>{left}</span>
      <div style={{ flex: 1, height: 2, background: C.oxblood, margin: "0 26px" }} />
      <span>{right}</span>
    </div>
  );

  const image = new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: C.cream, color: C.oxblood, padding: "80px 110px 70px" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width={220} height={220} alt="" />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 50 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontFamily: "Script", fontStyle: "italic", fontWeight: 300, fontSize: 104, lineHeight: 1, marginBottom: 26 }}>invoice</span>
            <span style={{ ...caps(24), fontWeight: 500 }}>{inv.client.name}</span>
            {inv.client.phone && <span style={{ ...caps(22), marginTop: 6 }}>{inv.client.phone}</span>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={caps(22, { color: C.burnt })}>No. {inv.code}</span>
            <span style={caps(22, { marginTop: 8 })}>{inv.issued}</span>
            {inv.gownMeta && <span style={caps(22, { marginTop: 8 })}>{inv.gownMeta}</span>}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 80, padding: "0 40px" }}>
          {ruleHead("The gown", "Price")}
          {inv.lines.map(line)}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22, paddingTop: 22, borderTop: `2px solid ${C.oxblood}`, fontFamily: "Display", fontSize: 46 }}>
            <span>Total</span>
            <span>{inv.total}</span>
          </div>

          {inv.received.length > 0 && ruleHead("Received", "", 54)}
          {inv.received.slice(-4).map(line)}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 44, padding: "26px 34px", background: C.oxblood, color: C.cream }}>
            <span style={caps(26)}>{inv.balance > 0 ? "Balance due" : "Paid in full"}</span>
            <span style={{ fontFamily: "Display", fontSize: 42 }}>{inv.balanceText}</span>
          </div>
          {inv.dueText && <span style={caps(20, { color: C.burnt, marginTop: 14, alignSelf: "flex-end" })}>{inv.dueText}</span>}
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", ...caps(24) }}>
            <span>{BUSINESS.name}</span>
            <div style={{ width: 80, height: 2, background: C.oxblood, margin: "0 22px" }} />
            <span>{BUSINESS.tagline}</span>
          </div>
          {phone && <span style={caps(20, { marginTop: 14 })}>WhatsApp {phone}</span>}
          <span style={caps(20, { marginTop: 6 })}>{extra.address ?? BUSINESS.city}</span>
          {(extra.website || extra.instagram) && (
            <div style={{ display: "flex", justifyContent: "space-between", alignSelf: "stretch", marginTop: 30, ...caps(18) }}>
              <span>{extra.website ?? ""}</span>
              <span>{extra.instagram ?? ""}</span>
            </div>
          )}
        </div>
      </div>
    ),
    { width: W, height: H, fonts: fontCache },
  );
  image.headers.set("Cache-Control", "private, no-store");
  image.headers.set("Content-Disposition", `inline; filename="Shado-Badr-invoice-${inv.code}.png"`);
  return image;
}
