// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.js";
import fs from "node:fs";
import path from "node:path";
var __vite_injected_original_dirname = "/home/project";
function publicSafe() {
  const publicDir = path.resolve(__vite_injected_original_dirname, "public");
  return {
    name: "public-safe",
    enforce: "post",
    // Dev: serve public files ourselves
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent(req.url ?? "/").split("?")[0];
        const filePath = path.join(publicDir, url);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const ext = path.extname(filePath).toLowerCase();
          const mime = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".svg": "image/svg+xml",
            ".gif": "image/gif",
            ".webp": "image/webp",
            ".ico": "image/x-icon",
            ".txt": "text/plain",
            ".xml": "application/xml"
          };
          res.setHeader("Content-Type", mime[ext] ?? "application/octet-stream");
          fs.createReadStream(filePath).pipe(res);
          return;
        }
        next();
      });
    },
    // Build: copy public files, skipping filenames with spaces
    closeBundle() {
      const outDir = path.resolve(__vite_injected_original_dirname, "dist");
      function copyDir(src, dest) {
        fs.mkdirSync(dest, { recursive: true });
        for (const entry of fs.readdirSync(src)) {
          if (entry.includes(" ")) continue;
          const srcPath = path.join(src, entry);
          const destPath = path.join(dest, entry);
          if (fs.statSync(srcPath).isDirectory()) {
            copyDir(srcPath, destPath);
          } else if (!fs.existsSync(destPath)) {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      }
      if (fs.existsSync(publicDir)) copyDir(publicDir, outDir);
    }
  };
}
var vite_config_default = defineConfig({
  plugins: [react(), publicSafe()],
  publicDir: false,
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    headers: {
      "X-Frame-Options": "ALLOWALL",
      "Content-Security-Policy": "frame-ancestors *"
    }
  },
  optimizeDeps: {
    exclude: ["lucide-react"]
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          stripe: ["@stripe/react-stripe-js", "@stripe/stripe-js"],
          supabase: ["@supabase/supabase-js"]
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgZnMgZnJvbSAnbm9kZTpmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuXG4vLyBWaXRlJ3MgYnVpbHQtaW4gcHVibGljIGNvcHkgZmFpbHMgb24gZmlsZW5hbWVzIHdpdGggc3BhY2VzIGluIHNvbWVcbi8vIGVudmlyb25tZW50cy4gV2UgZGlzYWJsZSBwdWJsaWNEaXIgYW5kIGhhbmRsZSBjb3B5aW5nIG91cnNlbHZlcyxcbi8vIHNraXBwaW5nIHByb2JsZW1hdGljIGZpbGVuYW1lcy4gSW4gZGV2IG1vZGUgd2UgYWRkIGEgc3RhdGljIG1pZGRsZXdhcmUuXG5mdW5jdGlvbiBwdWJsaWNTYWZlKCkge1xuICBjb25zdCBwdWJsaWNEaXIgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAncHVibGljJyk7XG5cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAncHVibGljLXNhZmUnLFxuICAgIGVuZm9yY2U6ICdwb3N0JyBhcyBjb25zdCxcblxuICAgIC8vIERldjogc2VydmUgcHVibGljIGZpbGVzIG91cnNlbHZlc1xuICAgIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXI6IGltcG9ydCgndml0ZScpLlZpdGVEZXZTZXJ2ZXIpIHtcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gICAgICAgIGNvbnN0IHVybCA9IGRlY29kZVVSSUNvbXBvbmVudChyZXEudXJsID8/ICcvJykuc3BsaXQoJz8nKVswXTtcbiAgICAgICAgY29uc3QgZmlsZVBhdGggPSBwYXRoLmpvaW4ocHVibGljRGlyLCB1cmwpO1xuICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhmaWxlUGF0aCkgJiYgZnMuc3RhdFN5bmMoZmlsZVBhdGgpLmlzRmlsZSgpKSB7XG4gICAgICAgICAgY29uc3QgZXh0ID0gcGF0aC5leHRuYW1lKGZpbGVQYXRoKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgIGNvbnN0IG1pbWU6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gICAgICAgICAgICAnLmpwZyc6ICdpbWFnZS9qcGVnJywgJy5qcGVnJzogJ2ltYWdlL2pwZWcnLCAnLnBuZyc6ICdpbWFnZS9wbmcnLFxuICAgICAgICAgICAgJy5zdmcnOiAnaW1hZ2Uvc3ZnK3htbCcsICcuZ2lmJzogJ2ltYWdlL2dpZicsICcud2VicCc6ICdpbWFnZS93ZWJwJyxcbiAgICAgICAgICAgICcuaWNvJzogJ2ltYWdlL3gtaWNvbicsICcudHh0JzogJ3RleHQvcGxhaW4nLCAnLnhtbCc6ICdhcHBsaWNhdGlvbi94bWwnLFxuICAgICAgICAgIH07XG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgbWltZVtleHRdID8/ICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nKTtcbiAgICAgICAgICBmcy5jcmVhdGVSZWFkU3RyZWFtKGZpbGVQYXRoKS5waXBlKHJlcyk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIG5leHQoKTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvLyBCdWlsZDogY29weSBwdWJsaWMgZmlsZXMsIHNraXBwaW5nIGZpbGVuYW1lcyB3aXRoIHNwYWNlc1xuICAgIGNsb3NlQnVuZGxlKCkge1xuICAgICAgY29uc3Qgb3V0RGlyID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ2Rpc3QnKTtcbiAgICAgIGZ1bmN0aW9uIGNvcHlEaXIoc3JjOiBzdHJpbmcsIGRlc3Q6IHN0cmluZykge1xuICAgICAgICBmcy5ta2RpclN5bmMoZGVzdCwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgZnMucmVhZGRpclN5bmMoc3JjKSkge1xuICAgICAgICAgIGlmIChlbnRyeS5pbmNsdWRlcygnICcpKSBjb250aW51ZTtcbiAgICAgICAgICBjb25zdCBzcmNQYXRoID0gcGF0aC5qb2luKHNyYywgZW50cnkpO1xuICAgICAgICAgIGNvbnN0IGRlc3RQYXRoID0gcGF0aC5qb2luKGRlc3QsIGVudHJ5KTtcbiAgICAgICAgICBpZiAoZnMuc3RhdFN5bmMoc3JjUGF0aCkuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgY29weURpcihzcmNQYXRoLCBkZXN0UGF0aCk7XG4gICAgICAgICAgfSBlbHNlIGlmICghZnMuZXhpc3RzU3luYyhkZXN0UGF0aCkpIHtcbiAgICAgICAgICAgIGZzLmNvcHlGaWxlU3luYyhzcmNQYXRoLCBkZXN0UGF0aCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoZnMuZXhpc3RzU3luYyhwdWJsaWNEaXIpKSBjb3B5RGlyKHB1YmxpY0Rpciwgb3V0RGlyKTtcbiAgICB9LFxuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKSwgcHVibGljU2FmZSgpXSxcbiAgcHVibGljRGlyOiBmYWxzZSxcbiAgc2VydmVyOiB7XG4gICAgaG9zdDogdHJ1ZSxcbiAgICBwb3J0OiA1MTczLFxuICAgIHN0cmljdFBvcnQ6IHRydWUsXG4gICAgYWxsb3dlZEhvc3RzOiB0cnVlLFxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdYLUZyYW1lLU9wdGlvbnMnOiAnQUxMT1dBTEwnLFxuICAgICAgJ0NvbnRlbnQtU2VjdXJpdHktUG9saWN5JzogXCJmcmFtZS1hbmNlc3RvcnMgKlwiLFxuICAgIH0sXG4gIH0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGV4Y2x1ZGU6IFsnbHVjaWRlLXJlYWN0J10sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgIHZlbmRvcjogWydyZWFjdCcsICdyZWFjdC1kb20nLCAncmVhY3Qtcm91dGVyLWRvbSddLFxuICAgICAgICAgIHN0cmlwZTogWydAc3RyaXBlL3JlYWN0LXN0cmlwZS1qcycsICdAc3RyaXBlL3N0cmlwZS1qcyddLFxuICAgICAgICAgIHN1cGFiYXNlOiBbJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcyddLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsb0JBQW9CO0FBQ3RQLE9BQU8sV0FBVztBQUNsQixPQUFPLFFBQVE7QUFDZixPQUFPLFVBQVU7QUFIakIsSUFBTSxtQ0FBbUM7QUFRekMsU0FBUyxhQUFhO0FBQ3BCLFFBQU0sWUFBWSxLQUFLLFFBQVEsa0NBQVcsUUFBUTtBQUVsRCxTQUFPO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixTQUFTO0FBQUE7QUFBQSxJQUdULGdCQUFnQixRQUFzQztBQUNwRCxhQUFPLFlBQVksSUFBSSxDQUFDLEtBQUssS0FBSyxTQUFTO0FBQ3pDLGNBQU0sTUFBTSxtQkFBbUIsSUFBSSxPQUFPLEdBQUcsRUFBRSxNQUFNLEdBQUcsRUFBRSxDQUFDO0FBQzNELGNBQU0sV0FBVyxLQUFLLEtBQUssV0FBVyxHQUFHO0FBQ3pDLFlBQUksR0FBRyxXQUFXLFFBQVEsS0FBSyxHQUFHLFNBQVMsUUFBUSxFQUFFLE9BQU8sR0FBRztBQUM3RCxnQkFBTSxNQUFNLEtBQUssUUFBUSxRQUFRLEVBQUUsWUFBWTtBQUMvQyxnQkFBTSxPQUErQjtBQUFBLFlBQ25DLFFBQVE7QUFBQSxZQUFjLFNBQVM7QUFBQSxZQUFjLFFBQVE7QUFBQSxZQUNyRCxRQUFRO0FBQUEsWUFBaUIsUUFBUTtBQUFBLFlBQWEsU0FBUztBQUFBLFlBQ3ZELFFBQVE7QUFBQSxZQUFnQixRQUFRO0FBQUEsWUFBYyxRQUFRO0FBQUEsVUFDeEQ7QUFDQSxjQUFJLFVBQVUsZ0JBQWdCLEtBQUssR0FBRyxLQUFLLDBCQUEwQjtBQUNyRSxhQUFHLGlCQUFpQixRQUFRLEVBQUUsS0FBSyxHQUFHO0FBQ3RDO0FBQUEsUUFDRjtBQUNBLGFBQUs7QUFBQSxNQUNQLENBQUM7QUFBQSxJQUNIO0FBQUE7QUFBQSxJQUdBLGNBQWM7QUFDWixZQUFNLFNBQVMsS0FBSyxRQUFRLGtDQUFXLE1BQU07QUFDN0MsZUFBUyxRQUFRLEtBQWEsTUFBYztBQUMxQyxXQUFHLFVBQVUsTUFBTSxFQUFFLFdBQVcsS0FBSyxDQUFDO0FBQ3RDLG1CQUFXLFNBQVMsR0FBRyxZQUFZLEdBQUcsR0FBRztBQUN2QyxjQUFJLE1BQU0sU0FBUyxHQUFHLEVBQUc7QUFDekIsZ0JBQU0sVUFBVSxLQUFLLEtBQUssS0FBSyxLQUFLO0FBQ3BDLGdCQUFNLFdBQVcsS0FBSyxLQUFLLE1BQU0sS0FBSztBQUN0QyxjQUFJLEdBQUcsU0FBUyxPQUFPLEVBQUUsWUFBWSxHQUFHO0FBQ3RDLG9CQUFRLFNBQVMsUUFBUTtBQUFBLFVBQzNCLFdBQVcsQ0FBQyxHQUFHLFdBQVcsUUFBUSxHQUFHO0FBQ25DLGVBQUcsYUFBYSxTQUFTLFFBQVE7QUFBQSxVQUNuQztBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQ0EsVUFBSSxHQUFHLFdBQVcsU0FBUyxFQUFHLFNBQVEsV0FBVyxNQUFNO0FBQUEsSUFDekQ7QUFBQSxFQUNGO0FBQ0Y7QUFFQSxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQztBQUFBLEVBQy9CLFdBQVc7QUFBQSxFQUNYLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQSxJQUNaLGNBQWM7QUFBQSxJQUNkLFNBQVM7QUFBQSxNQUNQLG1CQUFtQjtBQUFBLE1BQ25CLDJCQUEyQjtBQUFBLElBQzdCO0FBQUEsRUFDRjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLGNBQWM7QUFBQSxFQUMxQjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBLFVBQ1osUUFBUSxDQUFDLFNBQVMsYUFBYSxrQkFBa0I7QUFBQSxVQUNqRCxRQUFRLENBQUMsMkJBQTJCLG1CQUFtQjtBQUFBLFVBQ3ZELFVBQVUsQ0FBQyx1QkFBdUI7QUFBQSxRQUNwQztBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
