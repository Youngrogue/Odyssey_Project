const wordmark = "Odyssey";
const descriptor = "Project";
export const brand = {
  wordmark,
  descriptor,
  name: wordmark,
  fullName: `${wordmark} ${descriptor}`,
  website: "https://odyssey.soralives.xyz",
  // Optional anonymous interest survey (Tally); separate from the email waitlist.
  surveyUrl: "https://tally.so/r/J19WzR",
  title: `${wordmark} | A little curiosity. A lot more life.`,
  description:
    "An upcoming way to discover activities, find communities and build your Bucket lists, at home and around your city. Join for launch updates.",
} as const;
