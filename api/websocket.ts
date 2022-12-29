import { Player, removePlayer, sendGlobalEvent, hasPlayer } from "../state.ts";
import { eventHandler } from "../event_handlers.ts";

import type { ConnInfo, PathParams } from "../deps.ts";

interface UnwrappedPromise {
  promise: Promise<void>;
  resolve: () => void;
  reject: (reason?: string) => void;
}
export const PREFIX = "/connect/:username/:team";

export async function get(
  request: Request,
  _conn: ConnInfo,
  params: PathParams,
): Promise<Response> {


  if (hasPlayer(params!.username)) {
    return new Response(null, { status: 400 });
  }

  const upgrade = Deno.upgradeWebSocket(request, { idleTimeout: 10 });

  const player: Player = {
    ws: upgrade.socket,
    username: params!.username,
    team: parseInt(params!.team) as 0 | 1,
  };

  await setupWebSocket(player);

  return upgrade.response;
}

async function setupWebSocket(player: Player): Promise<void> {
  player.ws.addEventListener("close", (evt) => {
    removePlayer(player);
    sendGlobalEvent({
      kind: "disconnect",
      username: player.username,
      reason: evt.reason,
    });
  });

  player.ws.addEventListener("error", () => {
    removePlayer(player);
    sendGlobalEvent({
      kind: "disconnect",
      username: player.username,
      reason: "Connection Errored",
    });
  });

  player.ws.addEventListener("message", (evt) => {
    eventHandler(player, JSON.parse(evt.data));
  });

  const unwrappedPromise: UnwrappedPromise = {} as UnwrappedPromise;
  unwrappedPromise.promise = new Promise((res, rej) => {
    unwrappedPromise.resolve = res as () => void;
    unwrappedPromise.reject = rej;
  });

  if (player.ws.readyState === WebSocket.OPEN) {
    sendGlobalEvent({
      kind: "connect",
      username: player.username,
      team: player.team,
    });
    return;
  }

  player.ws.addEventListener("open", () => {
    sendGlobalEvent({
      kind: "connect",
      username: player.username,
      team: player.team,
    });
  });

  return await unwrappedPromise.promise;
}
