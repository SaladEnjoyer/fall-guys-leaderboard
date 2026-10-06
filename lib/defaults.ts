import type { LeagueState } from "@/lib/types"

export function createInitialState(): LeagueState {
  return {
    leagues: [
      {
        id: "liga-1",
        name: "League 1",
        accent: "gold",
        promotionSlots: 0,
        relegationSlots: 2,
      },
      {
        id: "liga-2",
        name: "League 2",
        accent: "violet",
        promotionSlots: 2,
        relegationSlots: 2,
      },
      {
        id: "liga-3",
        name: "League 3",
        accent: "cyan",
        promotionSlots: 2,
        relegationSlots: 2,
      },
      {
        id: "liga-4",
        name: "League 4",
        accent: "pink",
        promotionSlots: 2,
        relegationSlots: 2,
      },
      {
        id: "liga-5",
        name: "League 5",
        accent: "lime",
        promotionSlots: 2,
        relegationSlots: 0,
      },
    ],
    players: [],
    matches: [],
  }
}
