import { serve, serveStatic } from "./deps.ts";
import { loadApis } from "./api_loader.ts";

const EXTENSIONS_DIRECTORY = new URL("./api", import.meta.url);

serve({
  ...await loadApis(EXTENSIONS_DIRECTORY),
  "/": serveStatic("./public/index.html", { baseUrl: import.meta.url }),
  "/:filename+": serveStatic("./public", { baseUrl: import.meta.url }),
  404: () => new Response("Not found", { status: 404 }),
}, {
  port: 8080,
  onError(_) {
    return new Response(null, { status: 500 });
  },
  onListen({ port, hostname }) {
    console.log(`Server is listening on ${hostname}:${port}`);
  },
});
