// Marketing previews are not canonical scoring definitions. Broad ideas may
// lead to several actual activities, each with its own eligibility criteria.
export type RewardPreview = {
  label: string;
  family: string;
  interests: string;
  detail: string;
  foodie?: boolean;
};
export const rewardPreviews: Record<string, RewardPreview> = {
  salsa: {
    label: "Salsa",
    family: "Music & Dance",
    interests: "Music & Dance",
    detail:
      "Learn a step, practise a routine, find your rhythm. Dance progress belongs alongside every other pursuit.",
  },
  konpa: {
    label: "Konpa",
    family: "Music & Dance",
    interests: "Music & Dance",
    detail: "A lesson or practice at home can become part of your dance story.",
  },
  pottery: {
    label: "Pottery",
    family: "Maker Portfolio",
    interests: "Art & Craft",
    detail:
      "Finished projects tell their own story. Keep the progress you make, even when your first bowl is a little wonky.",
  },
  cuisine: {
    label: "Trying a new cuisine",
    family: "Foodie",
    interests: "Food Discovery",
    detail:
      "A passport for your palate. Cook, order in or dine out — your next discovery could come from anywhere.",
    foodie: true,
  },
  games: {
    label: "Games night",
    family: "Tabletop Explorer",
    interests: "Board & Card Games",
    detail:
      "One more round, one more new favourite. Discover games you love and people who love them too.",
  },
  gallery: {
    label: "Gallery visits",
    family: "Culture Trail",
    interests: "Culture & History",
    detail:
      "Find the art around you. Make time for a gallery, an exhibition and a new way of seeing your city.",
  },
  chess: {
    label: "Chess puzzles",
    family: "Chess Foundations",
    interests: "Chess",
    detail:
      "Little puzzles. Big lightbulb moments. Turn a quiet evening into a new way of thinking.",
  },
  archery: {
    label: "Archery",
    family: "Sports exploration",
    interests: "Adventure",
    detail:
      "Steady your aim, take your first shot and discover a sport that might surprise you.",
  },
  surfing: {
    label: "Surfing",
    family: "Water activities",
    interests: "Water Activities",
    detail:
      "Salt air, a first lesson and a completely different kind of balance. Your water adventures can start small.",
  },
  paint: {
    label: "Painting",
    family: "Maker Portfolio",
    interests: "Art & Craft",
    detail:
      "A finished painting at home or in a workshop can be part of the same creative journey.",
  },
  bake: {
    label: "Baking",
    family: "Kitchen Repertoire",
    interests: "Cooking & Baking",
    detail:
      "A new recipe, a warm kitchen, something worth sharing. Build a repertoire one delicious first at a time.",
  },
  ramen: {
    label: "Cooking a new cuisine",
    family: "Foodie",
    interests: "Cooking & Baking",
    detail:
      "Travel through your taste buds. Make a dish from somewhere new and give your kitchen a fresh story.",
    foodie: true,
  },
  karaoke: {
    label: "Karaoke",
    family: "Music & Dance",
    interests: "Music & Dance / Nightlife, depending on the quest",
    detail:
      "A living-room singalong and an organised karaoke night offer different ways to take part.",
  },
  picnic: {
    label: "Community picnics",
    family: "Community Connector",
    interests: "Depends on the event’s activity",
    detail:
      "Good food, fresh air and a conversation you didn’t see coming. Make room for new people.",
  },
  bookclub: {
    label: "Book clubs",
    family: "Reading & community",
    interests: "Books & Writing",
    detail:
      "A good book opens a world. A good book club gives you people to explore it with.",
  },
  neighbourhood: {
    label: "Neighbourhood discovery",
    family: "Places Explorer",
    interests: "Travel or Culture & History, depending on the activity",
    detail:
      "A familiar street, a hidden corner, a museum you’ve always passed. Discover the stories closer to home.",
  },
  reading: {
    label: "A cosy discovery",
    family: "Home & discovery",
    interests: "Books & Writing, Culture & History or Music & Dance",
    detail:
      "A short story, a virtual exhibition, an album from somewhere new. You can go a long way from your sofa.",
  },
  photostory: {
    label: "Photo stories",
    family: "Maker Portfolio",
    interests: "Photography",
    detail:
      "Find beauty in the ordinary. Turn the little details of your day into a story only you could tell.",
  },
};

export const trophyRanks = ["F", "E", "D", "C", "B", "A", "S"] as const;
