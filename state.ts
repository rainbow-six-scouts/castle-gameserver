import { ServerEvent, ServerRingTeam } from "./deps.ts";

export interface Player {
  ws: WebSocket;
  username: string;
  team: 0 | 1;
}

export interface State {
  players: Set<Player>;
  teams: [Set<Player>, Set<Player>];
}

const SERVER_STATE: State = {
  players: new Set(),
  teams: [new Set(), new Set()],
};

/** Check if a player's name is unique */
export function hasPlayer(username: string): boolean {
  for (const player of SERVER_STATE.players.values()) {
    if (player.username === username) {
      return true;
    }
  }

  return false;
}

/** Does not send any websocket event */
export function addPlayer(player: Player) {
  SERVER_STATE.players.add(player);
  SERVER_STATE.teams[player.team].add(player);
}

/** Does not send any websocket event */
export function removePlayer(player: Player) {
  SERVER_STATE.players.delete(player);
  SERVER_STATE.teams[player.team].delete(player);
}

/** Does not send any websocket event */
export function changeTeam(player: Player) {
  SERVER_STATE.teams[player.team].delete(player);
  SERVER_STATE.teams[(player.team + 1) % 2].add(player);
}

/** Sends `evt` to all players in team with id `teamID` */
export function sendTeamEvent(evt: ServerRingTeam, teamID: number) {
  for (const player of SERVER_STATE.teams[teamID].values()) {
    player.ws.send(JSON.stringify(evt));
  }
}

/** Sends `evt` to all players */
export function sendGlobalEvent(evt: ServerEvent) {
  for (const player of SERVER_STATE.players.values()) {
    player.ws.send(JSON.stringify(evt));
  }
}
