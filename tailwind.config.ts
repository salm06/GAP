import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        head: "var(--font-head)",
        body: "var(--font-body)",
        hand: "var(--font-hand)",
        guida: "var(--font-guida)",
      },
      fontSize: {
        azione: ["1.6rem", { lineHeight: "1.95rem", fontWeight: "800" }],
        "azione-lg": ["2.1rem", { lineHeight: "2.45rem", fontWeight: "800" }],
      },
      minHeight: { tap: "44px" },
      minWidth: { tap: "44px" },
      colors: {
        bg: "var(--bg)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        surface: "var(--surface)",
        panel: "var(--panel)",
        "panel-line": "var(--panel-line)",
        accent: "var(--accent)",
        "accent-ink": "var(--accent-ink)",
        deep: "var(--deep)",
        fai: "var(--fai)",
        "fai-ink": "var(--fai-ink)",
        capisci: "var(--capisci)",
        "capisci-ink": "var(--capisci-ink)",
        "metodo-design": "var(--metodo-design)",
        "metodo-storytelling": "var(--metodo-storytelling)",
        fatto: "var(--stato-fatto)",
        corrente: "var(--stato-corrente)",
        dafare: "var(--stato-dafare)",
        ritardo: "var(--stato-ritardo)",
        anticipo: "var(--stato-anticipo)",
      },
      borderRadius: {
        card: "22px",
      },
    },
  },
  plugins: [],
} satisfies Config;
