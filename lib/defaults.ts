import type { LeagueState } from "@/lib/types"

export function createInitialState(): LeagueState {
  return {
    leagues: [
      {
        id: "liga-1",
        name: "Liga 1",
        accent: "gold",
        promotionSlots: 0,
        relegationSlots: 2,
      },
      {
        id: "liga-2",
        name: "Liga 2",
        accent: "violet",
        promotionSlots: 2,
        relegationSlots: 2,
      },
      {
        id: "liga-3",
        name: "Liga 3",
        accent: "cyan",
        promotionSlots: 2,
        relegationSlots: 2,
      },
      {
        id: "liga-4",
        name: "Liga 4",
        accent: "pink",
        promotionSlots: 2,
        relegationSlots: 0,
      },
    ],
    players: [],
    matches: [],
  }
}
