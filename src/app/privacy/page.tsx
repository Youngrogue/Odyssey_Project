import { Brand } from "@/components/brand";
import { publicSite } from "@/lib/public-site";
import { brand } from "@/lib/brand";
import { waitlistNotice } from "@/lib/waitlist/notice";

export const metadata = { title: `Privacy & contact | ${brand.name}` };
export const dynamic = "force-static";

export default function PrivacyPage() {
  const privacy = publicSite;
  const pendingDays = publicSite.pendingRetentionDays;
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header shell">
        <Brand />
      </header>
      <main id="main" className="privacy-main shell">
        <a className="back-link" href="/">
          ← Back to Odyssey
        </a>
        <p className="eyebrow">
          PRIVACY & CONTACT · {waitlistNotice.displayDate}
        </p>
        <h1>
          A small signup.
          <br />A clear purpose.
        </h1>
        <p>
          {brand.name} (Odyssey Project) is an upcoming activity-discovery and
          Bucket-list app. This notice covers this landing page and its launch
          waitlist, not accounts in the future app.
        </p>
        <h2>Your Bucket list on this device</h2>
        <p>
          Ideas you save, custom idea titles, categories, recurrence and
          checklist progress stay in this browser’s local storage. They are not
          sent to our server, synced to another device or added to a future
          account. Avoid putting sensitive information in your list, especially
          on a shared device. Use “Clear my list” or clear this site’s browser
          data to remove it. You can download a copy first.
        </p>
        <p>
          The partnership form prepares a draft on this page. It does not submit
          anything to us. Downloading saves a text file to your device; copying
          puts it on your clipboard. Where an email address is available, “Open
          email draft” opens your email application so you can review and send
          it yourself.
        </p>
        <h2>What joining means</h2>
        <p>
          When signups are open, submitting your email adds you to the waitlist
          and is your agreement to receive Odyssey emails about our launch: a
          welcome email when you join, then a launch email when Odyssey is
          ready. Joining does not create an app account or a public profile,
          and does not subscribe you to a broader newsletter.
        </p>
        <h2>What we store and who processes it</h2>
        <p>
          We store your email, signup and confirmation times, notice version,
          subscription status and any historical optional preferences. Abuse
          prevention uses keyed hashes of your email and request source; the
          application does not store a raw IP address in these counters.
        </p>
        <p>
          The service uses Cloudflare for hosting and contact-email forwarding,
          Neon for its private database, and Resend for email delivery. Email
          delivery, bounce and complaint events help us manage the subscription.
          Hosting and email services also process technical request and delivery
          information under their own settings and policies.
        </p>
        <p>
          Our optional interest survey is a separate, anonymous form hosted by
          Tally (EU-hosted). It does not ask for your email or other contact
          details and is not linked to the waitlist. Please do not include
          personal details in its free-text answers.
        </p>
        <p>
          Waitlist details are not displayed on this site, published to the
          editorial Google Sheet or shared with activity communities. We do not
          add advertising trackers or third-party analytics to this page. We
          keep provider open and click tracking disabled.
        </p>
        <h2>Historical invitations</h2>
        <p>
          Invitations and recognition are planned for the future app. We no
          longer create referral relationships or issue badges through this
          waitlist. Historical records follow the same retention and deletion
          policy as the associated signup.
        </p>
        <h2>Unsubscribe</h2>
        <p>
          Earlier signups were asked to confirm by email. Those confirmation
          links still work until they expire; we no longer send them.
        </p>
        <p>
          Each email includes an unsubscribe link. You do not need to sign in.
          Unsubscribing stops queued and future waitlist emails; a message
          already being sent may still arrive. Delivery failures and spam
          complaints may also stop further mail.
        </p>
        <h2>Retention and removal</h2>
        {privacy ? (
          <>
            <p>
              The waitlist is operated by {privacy.operatorName}. For access,
              correction or removal, contact{" "}
              <a href={`mailto:${privacy.contactEmail}`}>
                {privacy.contactEmail}
              </a>
              . We may need to confirm that you control the address before
              acting.
            </p>
            <p>
              We keep your email until 30 days after we send the launch
              announcement, and no longer than {privacy.retentionDays} days
              after you join, unless you unsubscribe sooner. Unconfirmed
              records from the earlier confirmation flow expire after{" "}
              {pendingDays} days. The daily cleanup removes expired records and
              their associated email jobs. Signing up does not transfer your
              data into a future app account.
            </p>
          </>
        ) : (
          <p>
            Before real signups open, we will publish the responsible operator,
            a monitored contact address and the selected retention period here.
            Collection remains closed until these details are set.
          </p>
        )}
        <p>
          Rate-limit and send-budget counters are kept for about two days.
          Provider-event records are cleared after 30 days. Completed or
          cancelled email jobs are also cleared after 30 days, or sooner when
          their associated signup is deleted.
        </p>
        <p>
          To avoid contacting an unsubscribed or suppressed address again, we
          retain a keyed hash of the address with no automatic expiry. This can
          still be personal data. The contact above is the route to discuss
          removal or rejoining; submitting the signup form again does not
          automatically resume emails. Separate provider logs and backups follow
          the configured providers’ retention settings.
        </p>
        <h2>Films and other content</h2>
        <p>
          Both films load only when you choose to play them. The videos,
          original character illustrations, logo and fonts are served with this
          site. The full app is coming soon. External links open the destination
          service, which has its own privacy practices.
        </p>
      </main>
      <footer className="site-footer shell">
        <Brand />
        <span>A little curiosity. A lot more life.</span>
        <a href="/">Back to Odyssey</a>
      </footer>
    </>
  );
}
