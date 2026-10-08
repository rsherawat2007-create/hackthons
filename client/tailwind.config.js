/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Instrument Sans", "ui-sans-serif", "system-ui"],
        display: ["Fraunces", "ui-serif", "Georgia"],
      },
      colors: {
        ink: "#0B1020",
        mist: "#F4F1FF",
        accent: {
          DEFAULT: "#6D5CFF",
          2: "#A855F7",
          3: "#22D3EE",
        },
      },
      boxShadow: {
        glow: "0 20px 60px -20px rgba(109,92,255,0.45)",
        card: "0 18px 50px -24px rgba(11,16,32,0.18)",
      },
      backgroundImage: {
        aurora:
          "radial-gradient(1200px 500px at 10% -10%, rgba(109,92,255,0.45), transparent), radial-gradient(900px 400px at 90% 0%, rgba(168,85,247,0.35), transparent), radial-gradient(700px 300px at 50% 100%, rgba(34,211,238,0.18), transparent)",
      },
    },
  },
  plugins: [],
};
