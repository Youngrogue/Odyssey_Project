export const groups = [
  { id: "all", label: "A bit of everything" },
  { id: "move", label: "Move & play" },
  { id: "make", label: "Make & create" },
  { id: "taste", label: "Taste something new" },
  { id: "connect", label: "Find your people" },
  { id: "explore", label: "Explore nearby" },
  { id: "home", label: "Stay in" },
] as const;
export type Group = Exclude<(typeof groups)[number]["id"], "all">;
export type Cadence = "once" | "daily" | "weekly" | "monthly";
export type Idea = {
  id: string;
  title: string;
  group: Group;
  setting: string;
  company: string;
  description: string;
  firstStep: string;
  symbol: "dance" | "clay" | "food" | "games" | "compass" | "book";
  tone: "yellow" | "violet" | "coral" | "mint";
};
export const ideas: Idea[] = [
  {
    id: "salsa",
    title: "Find your rhythm. Try salsa.",
    group: "move",
    setting: "Out & about",
    company: "Meet people",
    description:
      "A beginner class, a social dance, a first step. There’s more than one way to find your feet.",
    firstStep:
      "Look for an introductory salsa session. Check the organiser’s current venue and whether you need a partner.",
    symbol: "dance",
    tone: "violet",
  },
  {
    id: "pottery",
    title: "Make something with your hands.",
    group: "make",
    setting: "Indoor",
    company: "Solo or together",
    description:
      "Trade a little screen time for clay time. A wonky first bowl still counts as a first.",
    firstStep:
      "Try a pottery workshop, or start with an air-dry clay project at home.",
    symbol: "clay",
    tone: "coral",
  },
  {
    id: "cuisine",
    title: "Taste a country you haven’t tried.",
    group: "taste",
    setting: "Home or out",
    company: "Solo or together",
    description:
      "A new cuisine can be an adventure of its own. Cook, order in or discover a restaurant.",
    firstStep:
      "Choose an unfamiliar cuisine, then find a dish and learn a little about it. Taste your way around the world, one country at a time.",
    symbol: "food",
    tone: "yellow",
  },
  {
    id: "games",
    title: "Find your kind of games night.",
    group: "connect",
    setting: "Home or out",
    company: "Good company",
    description:
      "Whot, board games, a little friendly rivalry. Come for the game; stay for the conversation.",
    firstStep:
      "Invite a friend to play, or look for a games community with an upcoming session.",
    symbol: "games",
    tone: "mint",
  },
  {
    id: "gallery",
    title: "Take a turn through a gallery.",
    group: "explore",
    setting: "Out & about",
    company: "Solo or together",
    description:
      "See your city through someone else’s eyes. Find an exhibition and follow your curiosity.",
    firstStep:
      "Choose an art gallery near you and check its current opening hours and entry details.",
    symbol: "compass",
    tone: "yellow",
  },
  {
    id: "chess",
    title: "A small challenge. A cosy evening.",
    group: "home",
    setting: "At home",
    company: "Solo time",
    description:
      "A chess puzzle and a quiet corner. You don’t need to go out to try something new.",
    firstStep:
      "Attempt a few chess puzzles, then review the solutions. Go at your own pace.",
    symbol: "games",
    tone: "violet",
  },
  {
    id: "konpa",
    title: "Let Konpa change the tempo.",
    group: "move",
    setting: "Home or out",
    company: "Solo or together",
    description:
      "Try a new dance style, whether that’s a beginner lesson or a little practice at home.",
    firstStep:
      "Find an introductory Konpa lesson and practise the basic rhythm. A short first session is enough to start.",
    symbol: "dance",
    tone: "coral",
  },
  {
    id: "archery",
    title: "Give archery a shot.",
    group: "move",
    setting: "Out & about",
    company: "Solo or together",
    description:
      "Something different for your weekend: a beginner session, a bow and a new skill.",
    firstStep:
      "Find an archery provider offering beginner instruction and confirm the booking and equipment requirements.",
    symbol: "compass",
    tone: "mint",
  },
  {
    id: "surfing",
    title: "Meet the water a little differently.",
    group: "move",
    setting: "Out & about",
    company: "With an instructor",
    description:
      "Discover surfing as a new way to enjoy the coast. The first lesson is its own adventure.",
    firstStep:
      "Ask a surf school about a supervised beginner lesson, conditions and equipment before you make plans.",
    symbol: "compass",
    tone: "violet",
  },
  {
    id: "paint",
    title: "Paint without a perfect plan.",
    group: "make",
    setting: "Home or out",
    company: "Solo or together",
    description:
      "A sip-and-paint session or a blank page at home. Give your ideas somewhere to land.",
    firstStep:
      "Choose a simple subject and whatever art materials you have. Or find a beginner-friendly painting session.",
    symbol: "clay",
    tone: "yellow",
  },
  {
    id: "bake",
    title: "Bake your next little victory.",
    group: "home",
    setting: "At home",
    company: "Solo or together",
    description:
      "Make something from scratch, then share it — or keep the best piece for yourself.",
    firstStep:
      "Pick one recipe that fits your kitchen and dietary needs. Add the ingredients to your shopping list.",
    symbol: "food",
    tone: "coral",
  },
  {
    id: "ramen",
    title: "Turn your kitchen into a discovery.",
    group: "taste",
    setting: "At home",
    company: "Solo or together",
    description:
      "Try a new noodle dish and learn where it comes from. Food exploration can start at your stove.",
    firstStep:
      "Choose a recipe with a clear cuisine origin. An ingredient shop can help, but it’s preparing or tasting the dish that makes the experience.",
    symbol: "food",
    tone: "mint",
  },
  {
    id: "karaoke",
    title: "Sing the song. Yes, that one.",
    group: "connect",
    setting: "Home or out",
    company: "Good company",
    description:
      "A karaoke night, a living-room duet, an enthusiastic chorus. Perfect pitch is optional.",
    firstStep:
      "Pick a song and invite a friend, or find a karaoke event and check its current programme.",
    symbol: "dance",
    tone: "yellow",
  },
  {
    id: "picnic",
    title: "Make a little room for new people.",
    group: "connect",
    setting: "Out & about",
    company: "Meet people",
    description:
      "A community picnic is a simple way to share an afternoon around something you enjoy.",
    firstStep:
      "Find a public community event with clear host, date and venue details. Check what to bring.",
    symbol: "compass",
    tone: "coral",
  },
  {
    id: "bookclub",
    title: "Find people for your next chapter.",
    group: "connect",
    setting: "Home or out",
    company: "Meet people",
    description:
      "A book club, a good question, a conversation that outlasts the last page.",
    firstStep:
      "Look for a book discussion around a genre you enjoy, online or near you.",
    symbol: "book",
    tone: "violet",
  },
  {
    id: "neighbourhood",
    title: "See a familiar place with fresh eyes.",
    group: "explore",
    setting: "Out & about",
    company: "Solo or together",
    description:
      "A neighbourhood walk, a museum or a place you’ve always passed. Curiosity doesn’t need a plane ticket.",
    firstStep:
      "Choose one nearby place you want to learn about. Check access and plan a route that suits you.",
    symbol: "compass",
    tone: "mint",
  },
  {
    id: "reading",
    title: "Go somewhere. From your sofa.",
    group: "home",
    setting: "At home",
    company: "Solo time",
    description:
      "Read a short story, visit a museum online or discover an album from somewhere new.",
    firstStep:
      "Give yourself a little uninterrupted time and pick one story, virtual exhibition or album.",
    symbol: "book",
    tone: "yellow",
  },
  {
    id: "photostory",
    title: "Make a story out of the ordinary.",
    group: "make",
    setting: "Home or out",
    company: "Solo time",
    description:
      "Capture a few details of your day and turn them into a small photo story.",
    firstStep:
      "Choose a theme, take a few photos and put them in an order that tells a story.",
    symbol: "compass",
    tone: "violet",
  },
];
