import { walk } from "./deps.ts";
import type { Handler } from "./deps.ts";

type Api = Record<string, Handler> & {
  PREFIX: string;
};

export function generateCaller(api: Api): Handler {
  return (ctx, connInfo, params) => {
    const handler = api[ctx.method.toLowerCase()];

    if (!handler) return new Response(null, { status: 405 });

    return handler(ctx, connInfo, params);
  };
}

export async function loadApis(
  path: URL,
): Promise<Record<string, Handler>> {
  const iterable = walk(path, { includeDirs: false });
  const routes: Record<string, Handler> = {};
  const promises: Promise<void>[] = [];
  for await (const entry of iterable) {
    console.log(`Loading API: ${entry.name}`);
    const promise = import(new URL(entry.path, path).href)
      .then((x) => {
        if (!x.PREFIX) return;
        routes[x.PREFIX] = generateCaller(x);
        console.log(`Added API: ${entry.name}`);
      });

    promises.push(promise);
  }

  await Promise.all(promises);
  console.log(`Loaded ${promises.length} API's`);
  return routes;
}
