/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#070708",
        surface: "#0F0F11",
        "surface-raised": "#161618",
        border: "#242428",
        "border-subtle": "#1A1A1C",
        text: "#F2F0EB",
        "text-muted": "#8A8880",
        "text-faint": "#4A4845",
        gold: "#E8C547",
        "gold-dim": "#A88A2A",
        red: "#C24B2A",
        scene: {
          tension: "#C24B2A",
          action: "#D4742A",
          drama: "#6B7FD4",
          comedy: "#4BA86B",
          quiet: "#6B8A9E",
          transition: "#7A6B8A"
        }
      },
      fontFamily: {
        display: ["'Playfair Display'", "serif"],
        sans: ["'DM Sans'", "sans-serif"],
        mono: ["'DM Mono'", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        card: "0 4px 24px rgba(0,0,0,0.6)",
        "card-hover": "0 8px 40px rgba(0,0,0,0.8)",
        modal: "0 24px 80px rgba(0,0,0,0.9)",
        "glow-gold": "0 0 20px rgba(232,197,71,0.15)",
      }
    },
  },
  plugins: [],
}
