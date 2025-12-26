/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Singapore-inspired blue and white palette
        "sg-blue": {
          50: "#e6f3ff",
          100: "#cce7ff",
          200: "#99cfff",
          300: "#66b7ff",
          400: "#339fff",
          500: "#0087ff",
          600: "#006bcc",
          700: "#005099",
          800: "#003566",
          900: "#001a33",
        },
        "sg-white": "#ffffff",
        "sg-light": "#f8fafc",
        "sg-gray": "#64748b",
      },
      width: {
        popup: "350px",
      },
      height: {
        popup: "500px",
      },
    },
  },
  plugins: [],
};
