import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Confirm your email · Odyssey",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};
export default async function Confirm({
  searchParams,
}: {
  searchParams: Promise<{
    token?: string;
    done?: string;
    resent?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;
  const valid =
    typeof params.token === "string" &&
    /^[A-Za-z0-9_-]{43}$/.test(params.token);
  return (
    <main className="privacy-page">
      <a href="/">Odyssey</a>
      <h1>Confirm your email</h1>
      {params.error && (
        <p role="alert">
          {params.error === "limited"
            ? "Too many attempts. Please try again later."
            : params.error === "unavailable"
              ? "This action is temporarily unavailable. Please try again later."
              : params.error === "expired"
                ? "This confirmation link has expired, has already been used or is no longer valid. You can join again on the homepage."
                : "We could not process that request. Please use the link in your email, or join again on the homepage."}
        </p>
      )}
      {params.resent && (
        <p>
          Request saved. If this address can receive a new confirmation link, we
          will send one. Delivery may take a few minutes.
        </p>
      )}
      {params.done && !params.error ? (
        <p>
          You're on the list. You'll be among the first to hear when Odyssey
          launches.
        </p>
      ) : (
        <>
          <p>
            {valid
              ? "Choose the button below to confirm that you want a launch notification. Opening this page alone does not subscribe you."
              : "Open the confirmation link in your email. Opening this page alone does not subscribe you."}
          </p>
          {valid && (
            <form action="/api/waitlist/confirm" method="post">
              <input type="hidden" name="token" value={params.token} />
              <button className="button button-primary" type="submit">
                Confirm my email
              </button>
            </form>
          )}
        </>
      )}
      <p>
        <a href="/#activity-ideas">Return to exploring Odyssey</a>
      </p>
      <p>
        Confirmation links are no longer sent. If yours has expired, simply
        join again on the homepage.
      </p>
      <p>
        <a href="/privacy">Privacy notice</a>
      </p>
    </main>
  );
}
