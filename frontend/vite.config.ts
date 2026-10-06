import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// Minifiers write some string/regex escapes (e.g. "\x1b" in pdf.js) as raw
// control bytes. The hosted build must be plain text, so write them back as
// \xNN escapes — same values, since they only occur inside literals.
function escapeControlBytes(): Plugin {
  const escape = (code: string) =>
    code.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, (c) => `\\x${c.charCodeAt(0).toString(16).padStart(2, "0")}`);
  return {
    name: "escape-control-bytes",
    apply: "build",
    enforce: "post",
    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (!/\.m?js$/.test(file.fileName)) continue;
        if (file.type === "chunk") file.code = escape(file.code);
        else file.source = escape(typeof file.source === "string" ? file.source : new TextDecoder().decode(file.source));
      }
    },
  };
}

// `--mode artifact` builds a copy that can be hosted as a single page with no
// server routing (relative asset paths + an in-memory router).
export default defineConfig(({ mode }) => ({
  base: "./",
  plugins: [react(), ...(mode === "artifact" ? [escapeControlBytes()] : [])],
  build: {
    outDir: mode === "artifact" ? "dist-artifact" : "dist",
  },
}));
