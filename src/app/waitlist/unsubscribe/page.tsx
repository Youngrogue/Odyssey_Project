import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Unsubscribe · Odyssey",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};
export default async function Unsubscribe({
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
      <h1>Unsubscribe</h1>
      {params.error && (
        <p role="alert">
          {params.error === "limited"
            ? "Too many attempts. Please try again later."
            : params.error === "unavailable"
              ? "This action is temporarily unavailable. Please try again later."
              : "We could not process that request. Please use your email link or request a new one."}
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
          Request processed. A valid link stops future waitlist emails. A
          message already being sent may still arrive.
        </p>
      ) : (
        <>
          <p>
            No account or sign-in is needed. Choose below to stop future
            waitlist emails.
          </p>
          {valid ? (
            <form action="/api/waitlist/unsubscribe" method="post">
              <input type="hidden" name="token" value={params.token} />
              <button className="button button-primary" type="submit">
                Unsubscribe me
              </button>
            </form>
          ) : (
            <p>Use the unsubscribe link in your email.</p>
          )}
        </>
      )}
      <p>
        <a href="/privacy">Privacy notice</a>
      </p>
    </main>
  );
}
