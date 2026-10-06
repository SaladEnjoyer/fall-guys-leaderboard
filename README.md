# Fall Guys 1v1 League

Public scoreboard for five separate leagues. Anyone can view the standings. Only someone with the password can add players, create matchups, and record results. Saving a result recalculates that table on its own.

## Players and matchups

Each player has a name and a server, such as EU or NA. From the league desk, **Create matchups** builds a round robin: every player meets every other player once. An odd number of players gets a bye each round, so nobody is left without a full set of opponents.

A pairing is two lobbies.

- Lobby 1 starts on the first player’s server.
- Lobby 2 starts on the second player’s server.
- Either lobby server can be changed when you enter the result.

New matchups stay hidden. Set a timer (first one in N minutes, then every M minutes) or press **Release now** on a single matchup. The public page shows a matchup once it is released, once its timer is due, or once it has a result.

## Match format

Every lobby is **Solo mode, first to 5, win by 2**.

- The lobby ends when a player reaches 5 rounds and leads by 2.
- 5–3 is a win. 4–5 is not. That one has to reach 4–6.
- 6–4, 7–5, and 8–6 are finished. 5–4 and 6–5 are not.
- A score that keeps going after the lobby was already over, such as 6–3, is rejected.
- There are no draws. You win the lobby or you lose it.

## How scoring works

- Lobby win: 5 points
- Lobby loss: 0
- Winning both lobbies is 10 points and 2 wins
- MP counts lobbies played
- Tied on points, round difference comes first, then rounds won
- A tie right on a promotion or relegation cut is marked **contested**

## Provisional cuts

These can still be changed from the league desk, one league at a time. The starting guess is:

| League | Promotion | Relegation |
| --- | --- | --- |
| League 1 | none | bottom 2 |
| League 2 | top 2 | bottom 2 |
| League 3 | top 2 | bottom 2 |
| League 4 | top 2 | bottom 2 |
| League 5 | top 2 | none |

Set a cut to `0` to turn that zone off. Zones are painted only after a league has at least one lobby result. Players are not moved between leagues automatically.

## Run it

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123). The league desk is at `/admin`.

The local password, if you have not set another one, is `liga-fallguys`. To change it, copy `.env.example` to `.env.local` and edit `ADMIN_PASSWORD`.

Results are stored in `data/league.json` on the server. That file is not committed.
