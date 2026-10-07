# Fall Guys 1v1 League

Public scoreboard for five separate leagues. Anyone can view the standings. Only someone with the password can add players, create matchups, and record results. Saving a result recalculates that table on its own.

## Players and matchups

Each player has a name and a server, such as EU or NA. **Create matchups** builds the season: every player meets every other player once, one opponent at a time. An odd number of players gets a bye each round.

Round 1 is public immediately. Pick a league on the tables page to see who plays who. Each round stays up for 3 days, then the next pairs come out on their own.

A pairing is two lobbies.

- Lobby 1 starts on the first player’s server.
- Lobby 2 starts on the second player’s server.
- Either lobby server can be changed when you enter the result.

On the league desk, enter the scores and press **Save and close**. The table updates from that result. If a matchup still has no score when the 3 days end, it leaves the public page. It stays on the desk so you can give one player 5–0, 5–0 in both lobbies, or type the real scores. Later rounds stay on the desk until their day arrives.

## Match format

Every lobby is **Solo mode, first to 5**. A pairing is two lobbies, and each one ends when a player reaches 5 rounds.

- 5–4, 5–3, and 5–0 are wins. So is 4–5.
- A score that keeps going after 5, such as 6–4, is rejected.
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

Results are stored in `data/league.json` on the server. That file is not committed. A fresh server starts from `data/league.seed.json` when the live file is missing. Set `DATA_DIR` if the host keeps that file on a separate disk.

## Keep it online

The scoreboard has to run on a server that stays on. A link from this computer, or from a Cursor session, stops when that session stops. Turning off a personal computer is not what keeps the public page up.

A lasting link needs a host with a copy of this project and a place to keep `data/league.json`. On [Render](https://render.com), create a Web Service from the repository:

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Environment variable: `ADMIN_PASSWORD` (the desk password)

The free Render plan sleeps after a few minutes with no visitors, then wakes when someone opens the page. It does not keep the results file across a restart. A plan with a persistent disk, mounted with `DATA_DIR`, keeps the scores. Share only the public site address. Keep `/admin` and the password private.
