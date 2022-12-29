import type { ClientEvent, ClientRingTeam, ClientChangeTeam } from "./deps.ts";
import { changeTeam as stateChangeTeam, Player, sendGlobalEvent, sendTeamEvent } from "./state.ts";

const EVENT_PROCESSORS: Record<ClientEvent["kind"], CallableFunction> = {
  "change-team": changeTeam,
  "ring-team": ringTeam,
}


function changeTeam(player: Player, _: ClientChangeTeam) {
  stateChangeTeam(player);
  sendGlobalEvent({ kind: "change-team", username: player.username });
}

function ringTeam(player: Player, _: ClientRingTeam) {
  sendTeamEvent({ kind: "ring-team" }, (player.team + 1) % 2 as 0 | 1)
}

export function eventHandler(player: Player, data: ClientEvent) {
  EVENT_PROCESSORS[data.kind](player, data);
}
