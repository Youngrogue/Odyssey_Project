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
              : "We could not process that request. Please use your email link or request a new one."}
        </p>
      )}
      {params.resent && (
        <p>
          Request saved. If this address can receive a new confirmation link, we
          will send one. Delivery may take a few minutes.
        </p>
      )}
      {params.done ? (
        <p>
          Request processed. If your link was valid and current, your email is
          now confirmed. Your welcome email contains your private invitation
          page and a public link you can share with friends. No app account has
          been created.
        </p>
      ) : (
        <>
          <p>
            {valid
              ? "Choose the button below to confirm that you want meaningful project updates and a launch notification. Opening this page alone does not subscribe you."
              : "Open the confirmation link in your email, or request a new one below. Opening this page alone does not subscribe you."}
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
      <h2>Need a new link?</h2>
      <p>
        Confirmation links expire after 24 hours. If this address can receive
        another link, we will queue one.
      </p>
      <form action="/api/waitlist/resend" method="post">
        <label>
          Email <input type="email" name="email" required maxLength={254} />
        </label>
        <input type="hidden" name="website" value="" />
        <button className="button" type="submit">
          Request a new link
        </button>
      </form>
      <p>
        <a href="/privacy">Privacy notice</a>
      </p>
    </main>
  );
}
