# Fall Guys 1v1 League

Public scoreboard for five separate leagues. Anyone can view the standings. Only someone with the password can record matches, and saving a result recalculates that table on its own.

## Match format

Every match is **Solo mode, first to 5, win by 2**.

- The series ends when a player reaches 5 rounds and leads by 2.
- 5–3 is a win. 4–5 is not. That one has to reach 4–6.
- 6–4, 7–5, and 8–6 are finished. 5–4 and 6–5 are not.
- A score that keeps going after the match was already over, such as 6–3, is rejected.

Servers:

- **Split servers:** L2 is the away player's server. Lobby 2 is the home player's server.
- **Same server:** both lobbies are played on one server.

The home player is listed first.

## How scoring works

- Win: 3 points
- Loss: 0
- Tied on points, round difference comes first, then rounds won
- A tie right on a promotion or relegation cut is marked **contested**

## Provisional cuts

These can still be changed from the admin panel, one league at a time. The starting guess is:

| League | Promotion | Relegation |
| --- | --- | --- |
| League 1 | none | bottom 2 |
| League 2 | top 2 | bottom 2 |
| League 3 | top 2 | bottom 2 |
| League 4 | top 2 | bottom 2 |
| League 5 | top 2 | none |

Set a cut to `0` to turn that zone off. Zones are painted only after a league has at least one match.

## Run it

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123). The admin panel is at `/admin`.

The local password, if you have not set another one, is `liga-fallguys`. To change it, copy `.env.example` to `.env.local` and edit `ADMIN_PASSWORD`.

Results are stored in `data/league.json` on the server. That file is not committed.
