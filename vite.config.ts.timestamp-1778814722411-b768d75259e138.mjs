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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgZnMgZnJvbSAnbm9kZTpmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuXG4vLyBWaXRlJ3MgYnVpbHQtaW4gcHVibGljIGNvcHkgZmFpbHMgb24gZmlsZW5hbWVzIHdpdGggc3BhY2VzIGluIHNvbWVcbi8vIGVudmlyb25tZW50cy4gV2UgZGlzYWJsZSBwdWJsaWNEaXIgYW5kIGhhbmRsZSBjb3B5aW5nIG91cnNlbHZlcyxcbi8vIHNraXBwaW5nIHByb2JsZW1hdGljIGZpbGVuYW1lcy4gSW4gZGV2IG1vZGUgd2UgYWRkIGEgc3RhdGljIG1pZGRsZXdhcmUuXG5mdW5jdGlvbiBwdWJsaWNTYWZlKCkge1xuICBjb25zdCBwdWJsaWNEaXIgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAncHVibGljJyk7XG5cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAncHVibGljLXNhZmUnLFxuICAgIGVuZm9yY2U6ICdwb3N0JyBhcyBjb25zdCxcblxuICAgIC8vIERldjogc2VydmUgcHVibGljIGZpbGVzIG91cnNlbHZlc1xuICAgIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXI6IGltcG9ydCgndml0ZScpLlZpdGVEZXZTZXJ2ZXIpIHtcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gICAgICAgIGNvbnN0IHVybCA9IGRlY29kZVVSSUNvbXBvbmVudChyZXEudXJsID8/ICcvJykuc3BsaXQoJz8nKVswXTtcbiAgICAgICAgY29uc3QgZmlsZVBhdGggPSBwYXRoLmpvaW4ocHVibGljRGlyLCB1cmwpO1xuICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhmaWxlUGF0aCkgJiYgZnMuc3RhdFN5bmMoZmlsZVBhdGgpLmlzRmlsZSgpKSB7XG4gICAgICAgICAgY29uc3QgZXh0ID0gcGF0aC5leHRuYW1lKGZpbGVQYXRoKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgIGNvbnN0IG1pbWU6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gICAgICAgICAgICAnLmpwZyc6ICdpbWFnZS9qcGVnJywgJy5qcGVnJzogJ2ltYWdlL2pwZWcnLCAnLnBuZyc6ICdpbWFnZS9wbmcnLFxuICAgICAgICAgICAgJy5zdmcnOiAnaW1hZ2Uvc3ZnK3htbCcsICcuZ2lmJzogJ2ltYWdlL2dpZicsICcud2VicCc6ICdpbWFnZS93ZWJwJyxcbiAgICAgICAgICAgICcuaWNvJzogJ2ltYWdlL3gtaWNvbicsICcudHh0JzogJ3RleHQvcGxhaW4nLCAnLnhtbCc6ICdhcHBsaWNhdGlvbi94bWwnLFxuICAgICAgICAgIH07XG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgbWltZVtleHRdID8/ICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nKTtcbiAgICAgICAgICBmcy5jcmVhdGVSZWFkU3RyZWFtKGZpbGVQYXRoKS5waXBlKHJlcyk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIG5leHQoKTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvLyBCdWlsZDogY29weSBwdWJsaWMgZmlsZXMsIHNraXBwaW5nIGZpbGVuYW1lcyB3aXRoIHNwYWNlc1xuICAgIGNsb3NlQnVuZGxlKCkge1xuICAgICAgY29uc3Qgb3V0RGlyID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ2Rpc3QnKTtcbiAgICAgIGZ1bmN0aW9uIGNvcHlEaXIoc3JjOiBzdHJpbmcsIGRlc3Q6IHN0cmluZykge1xuICAgICAgICBmcy5ta2RpclN5bmMoZGVzdCwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgZnMucmVhZGRpclN5bmMoc3JjKSkge1xuICAgICAgICAgIGlmIChlbnRyeS5pbmNsdWRlcygnICcpKSBjb250aW51ZTtcbiAgICAgICAgICBjb25zdCBzcmNQYXRoID0gcGF0aC5qb2luKHNyYywgZW50cnkpO1xuICAgICAgICAgIGNvbnN0IGRlc3RQYXRoID0gcGF0aC5qb2luKGRlc3QsIGVudHJ5KTtcbiAgICAgICAgICBpZiAoZnMuc3RhdFN5bmMoc3JjUGF0aCkuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgY29weURpcihzcmNQYXRoLCBkZXN0UGF0aCk7XG4gICAgICAgICAgfSBlbHNlIGlmICghZnMuZXhpc3RzU3luYyhkZXN0UGF0aCkpIHtcbiAgICAgICAgICAgIGZzLmNvcHlGaWxlU3luYyhzcmNQYXRoLCBkZXN0UGF0aCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoZnMuZXhpc3RzU3luYyhwdWJsaWNEaXIpKSBjb3B5RGlyKHB1YmxpY0Rpciwgb3V0RGlyKTtcbiAgICB9LFxuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKSwgcHVibGljU2FmZSgpXSxcbiAgcHVibGljRGlyOiBmYWxzZSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgZXhjbHVkZTogWydsdWNpZGUtcmVhY3QnXSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgdmVuZG9yOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXItZG9tJ10sXG4gICAgICAgICAgc3RyaXBlOiBbJ0BzdHJpcGUvcmVhY3Qtc3RyaXBlLWpzJywgJ0BzdHJpcGUvc3RyaXBlLWpzJ10sXG4gICAgICAgICAgc3VwYWJhc2U6IFsnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJ10sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBeU4sU0FBUyxvQkFBb0I7QUFDdFAsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sUUFBUTtBQUNmLE9BQU8sVUFBVTtBQUhqQixJQUFNLG1DQUFtQztBQVF6QyxTQUFTLGFBQWE7QUFDcEIsUUFBTSxZQUFZLEtBQUssUUFBUSxrQ0FBVyxRQUFRO0FBRWxELFNBQU87QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLFNBQVM7QUFBQTtBQUFBLElBR1QsZ0JBQWdCLFFBQXNDO0FBQ3BELGFBQU8sWUFBWSxJQUFJLENBQUMsS0FBSyxLQUFLLFNBQVM7QUFDekMsY0FBTSxNQUFNLG1CQUFtQixJQUFJLE9BQU8sR0FBRyxFQUFFLE1BQU0sR0FBRyxFQUFFLENBQUM7QUFDM0QsY0FBTSxXQUFXLEtBQUssS0FBSyxXQUFXLEdBQUc7QUFDekMsWUFBSSxHQUFHLFdBQVcsUUFBUSxLQUFLLEdBQUcsU0FBUyxRQUFRLEVBQUUsT0FBTyxHQUFHO0FBQzdELGdCQUFNLE1BQU0sS0FBSyxRQUFRLFFBQVEsRUFBRSxZQUFZO0FBQy9DLGdCQUFNLE9BQStCO0FBQUEsWUFDbkMsUUFBUTtBQUFBLFlBQWMsU0FBUztBQUFBLFlBQWMsUUFBUTtBQUFBLFlBQ3JELFFBQVE7QUFBQSxZQUFpQixRQUFRO0FBQUEsWUFBYSxTQUFTO0FBQUEsWUFDdkQsUUFBUTtBQUFBLFlBQWdCLFFBQVE7QUFBQSxZQUFjLFFBQVE7QUFBQSxVQUN4RDtBQUNBLGNBQUksVUFBVSxnQkFBZ0IsS0FBSyxHQUFHLEtBQUssMEJBQTBCO0FBQ3JFLGFBQUcsaUJBQWlCLFFBQVEsRUFBRSxLQUFLLEdBQUc7QUFDdEM7QUFBQSxRQUNGO0FBQ0EsYUFBSztBQUFBLE1BQ1AsQ0FBQztBQUFBLElBQ0g7QUFBQTtBQUFBLElBR0EsY0FBYztBQUNaLFlBQU0sU0FBUyxLQUFLLFFBQVEsa0NBQVcsTUFBTTtBQUM3QyxlQUFTLFFBQVEsS0FBYSxNQUFjO0FBQzFDLFdBQUcsVUFBVSxNQUFNLEVBQUUsV0FBVyxLQUFLLENBQUM7QUFDdEMsbUJBQVcsU0FBUyxHQUFHLFlBQVksR0FBRyxHQUFHO0FBQ3ZDLGNBQUksTUFBTSxTQUFTLEdBQUcsRUFBRztBQUN6QixnQkFBTSxVQUFVLEtBQUssS0FBSyxLQUFLLEtBQUs7QUFDcEMsZ0JBQU0sV0FBVyxLQUFLLEtBQUssTUFBTSxLQUFLO0FBQ3RDLGNBQUksR0FBRyxTQUFTLE9BQU8sRUFBRSxZQUFZLEdBQUc7QUFDdEMsb0JBQVEsU0FBUyxRQUFRO0FBQUEsVUFDM0IsV0FBVyxDQUFDLEdBQUcsV0FBVyxRQUFRLEdBQUc7QUFDbkMsZUFBRyxhQUFhLFNBQVMsUUFBUTtBQUFBLFVBQ25DO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFDQSxVQUFJLEdBQUcsV0FBVyxTQUFTLEVBQUcsU0FBUSxXQUFXLE1BQU07QUFBQSxJQUN6RDtBQUFBLEVBQ0Y7QUFDRjtBQUVBLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDO0FBQUEsRUFDL0IsV0FBVztBQUFBLEVBQ1gsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLGNBQWM7QUFBQSxFQUMxQjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBLFVBQ1osUUFBUSxDQUFDLFNBQVMsYUFBYSxrQkFBa0I7QUFBQSxVQUNqRCxRQUFRLENBQUMsMkJBQTJCLG1CQUFtQjtBQUFBLFVBQ3ZELFVBQVUsQ0FBQyx1QkFBdUI7QUFBQSxRQUNwQztBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
