import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Odyssey waitlist",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};
export default function LegacyInvite(_props: {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  return (
    <main className="privacy-page">
      <a href="/">Odyssey</a>
      <h1>Keep exploring Odyssey</h1>
      <p>
        Invitations and early-member recognition are planned for the future app.
        The waitlist now uses only your email address.
      </p>
      <p>
        If you previously confirmed your email, no further action is needed.
      </p>
      <a href="/#waitlist">Visit the waitlist</a>
    </main>
  );
}
