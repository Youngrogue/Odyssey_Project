import Link from "next/link";
import { Brand } from "@/components/brand";
import { Icon } from "@/components/icons";
import { IsometricWorld } from "@/components/isometric-world";
import { Teaser } from "@/components/teaser";
import { WaitlistForm } from "@/components/waitlist-form";
import { DiscoveryPlayground } from "@/components/discovery-playground";
import { CommunityPreview } from "@/components/community-preview";
import { PartnerInvitation } from "@/components/partner-invitation";
import { SignupPreview } from "@/components/signup-preview";
import { isWaitlistEnabled } from "@/lib/waitlist/config";
import { renderWaitlistEmail } from "@/lib/email/templates";
import { brand } from "@/lib/brand";
export const dynamic = "force-dynamic";
const questions = [
  [
    `What is ${brand.name}?`,
    "An upcoming activity-discovery and personal Bucket-list app. Find things to try, discover communities around your interests, and keep track of the experiences you want to have.",
  ],
  [
    "What can I try on this page?",
    "Explore example activities, build a small Bucket list, add your own ideas and check them off. The preview list stays in this browser and can be downloaded or cleared. It doesn’t create an account or award XP.",
  ],
  [
    "When will the app be ready?",
    "We’re still building and haven’t announced a launch date. Join the waitlist when signups open for a useful welcome, meaningful progress updates and a launch notification.",
  ],
  [
    "Which cities are planned?",
    "Lagos, Abuja, Ibadan and Port Harcourt. We’re starting with the deepest collection of ideas in Lagos, with room for more places and activities as we grow.",
  ],
  [
    "Is it only for going out?",
    "Absolutely not. A new recipe, a chess puzzle, an online class or a games night at home all deserve a place. You don’t have to go far, spend money or bring a crowd to try something new.",
  ],
  [
    "Are these bookable events or official partners?",
    "These are activity ideas and community examples. Current event dates, venues and offers will be checked as the catalogue grows. Mentioning a business or community doesn’t mean it is an Odyssey partner.",
  ],
  [
    "What will you email me?",
    "When signups open: a confirmation email, then a welcome with ideas and what to expect. After that, meaningful project updates and a launch notification. No app account, broader newsletter or partner mailing list is created. You can unsubscribe.",
  ],
];
export default function HomePage() {
  const enabled = isWaitlistEnabled();
  const rawContact = process.env.PARTNERS_CONTACT_EMAIL?.trim();
  const partnerContact =
    rawContact && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawContact)
      ? rawContact
      : null;
  const previewInput = {
    origin: "https://example.invalid",
    token: "sample-only",
    unsubscribeToken: "sample-only",
  };
  const preview = (kind: "confirmation" | "welcome") =>
    renderWaitlistEmail(kind, previewInput).html.replace(
      /href="[^"]*"/g,
      'aria-disabled="true"',
    );
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header shell">
        <Brand />
        <nav aria-label="Main navigation">
          <a href="#try-something">The ideas</a>
          <a href="#find-your-people">The people</a>
          <a className="header-cta" href="#waitlist">
            Join the waitlist
            <Icon name="arrowUp" />
          </a>
        </nav>
      </header>
      <main id="main">
        <section className="hero shell" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="status-dot" />
              SOMETHING NEW IS TAKING SHAPE
            </p>
            <h1 id="hero-title">
              A little
              <br />
              curiosity.
              <br />
              <span className="highlight-text">A lot more life.</span>
            </h1>
            <p className="hero-description">
              Discover things to try, people to meet, and places to explore.
              We’re building a home for your next first — and a Bucket list for
              all the things you’ve been meaning to do.
            </p>
            <p className="hero-tagline">
              At home or out in the world. It all counts.
            </p>
            <div id="waitlist" className="waitlist-anchor">
              <p className="signup-intro">
                In development. Join for launch updates. No account needed.
              </p>
              <WaitlistForm enabled={enabled} />
              {!enabled && (
                <SignupPreview
                  confirmationHtml={preview("confirmation")}
                  welcomeHtml={preview("welcome")}
                />
              )}
            </div>
            <a className="hero-explore text-link" href="#try-something">
              Find something you’d love to try <Icon name="arrow" />
            </a>
          </div>
          <IsometricWorld />
        </section>
        <div className="city-strip">
          <div className="shell city-inner">
            <span className="city-label">A LITTLE CLOSER TO YOU</span>
            <div className="cities">
              <span>Lagos</span>
              <span>Abuja</span>
              <span>Ibadan</span>
              <span>Port Harcourt</span>
            </div>
            <span className="city-aside">
              Lagos first for depth.
              <br />
              Room for every kind of adventure.
            </span>
          </div>
        </div>
        <DiscoveryPlayground />
        <CommunityPreview />
        <section
          className="film-section"
          id="the-film"
          aria-labelledby="film-title"
        >
          <div className="shell section-space">
            <div className="film-layout">
              <div className="film-narrative">
                <p className="eyebrow">A GLIMPSE OF WHAT WE’RE BUILDING</p>
                <h2 id="film-title">
                  Same day?
                  <br />
                  <span>New story.</span>
                </h2>
                <p>
                  Break the usual loop. Find something that makes you curious.
                  Make a little room for it.
                </p>
                <ol className="film-steps">
                  <li>
                    <span>01</span>
                    <div>
                      <h3>Find a little inspiration</h3>
                      <p>
                        An activity, a place, a community — or your own idea.
                      </p>
                    </div>
                  </li>
                  <li>
                    <span>02</span>
                    <div>
                      <h3>Make it yours</h3>
                      <p>One day, every week, or whenever life allows.</p>
                    </div>
                  </li>
                  <li>
                    <span>03</span>
                    <div>
                      <h3>Collect the experiences</h3>
                      <p>A fuller list of “I did that.” At your own pace.</p>
                    </div>
                  </li>
                </ol>
                <details className="launch-summary">
                  <summary>
                    Read the 20-second film summary <Icon name="plus" />
                  </summary>
                  <p>
                    A colourful concept film introduces Odyssey project:
                    discover ideas, make a personal Bucket list, and explore
                    home activities, new tastes and communities. The closing
                    invitation is to join the waitlist. App footage is
                    illustrative; no live account or reward is demonstrated. The
                    film uses a musical soundtrack and on-screen text.
                  </p>
                </details>
              </div>
              <div className="launch-film-frame">
                <Teaser film="launch" />
                <span className="launch-film-note">
                  THE PRODUCT IDEA · A CONCEPT PREVIEW
                </span>
              </div>
            </div>
            <details className="brand-film-details">
              <summary>
                <span>
                  <Icon name="play" />
                  Watch the original “Break the loop” teaser
                </span>
                <span>
                  00:40 <Icon name="plus" />
                </span>
              </summary>
              <Teaser />
              <div className="film-caption">
                <span>YOUR LIFE. MORE PLAY.</span>
                <details>
                  <summary>
                    Read the film summary <Icon name="plus" />
                  </summary>
                  <p>
                    Wake, work, scroll, repeat? Take a new turn. Stay in or go
                    out: try a game, make a recipe, discover art or taste
                    something new. Save an idea, make time for it and mark it
                    done. The film imagines experiences becoming progress and
                    trophies; reward displays are concept examples, not live app
                    features. Foodie progress is open to any eligible countries’
                    cuisines, not a prescribed set.
                  </p>
                </details>
              </div>
            </details>
          </div>
        </section>
        <PartnerInvitation contact={partnerContact} />
        <section
          className="faq-section"
          id="questions"
          aria-labelledby="faq-title"
        >
          <div className="shell faq-inner section-space">
            <div>
              <p className="eyebrow">A FEW THINGS YOU MIGHT WONDER</p>
              <h2 id="faq-title">
                Curious? <br />
                Good.
              </h2>
              <Icon name="spark" className="faq-spark" />
            </div>
            <div className="faq-list">
              {questions.map(([question, answer]) => (
                <details key={question}>
                  <summary>
                    {question}
                    <Icon name="plus" />
                  </summary>
                  <p>
                    {answer}
                    {question === "What will you email me?" && (
                      <>
                        {" "}
                        <Link href="/privacy">Read the privacy notice.</Link>
                      </>
                    )}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <section
          className="final-invitation shell"
          aria-labelledby="invitation-title"
        >
          <span className="invitation-kicker">
            LEAVE A LITTLE ROOM FOR SOMETHING NEW.
          </span>
          <h2 id="invitation-title">
            Your next first
            <br />
            is out there<span>.</span>
          </h2>
          <a className="button button-yellow" href="#waitlist">
            Join the waitlist
            <Icon name="arrowUp" />
          </a>
          <p>At home. Around the corner. Beyond the usual.</p>
          <Icon name="spark" className="invitation-spark" />
        </section>
      </main>
      <footer className="site-footer shell">
        <Brand />
        <span>A little curiosity. A lot more life.</span>
        <Link href="/privacy">
          Privacy & contact
          <Icon name="arrowUp" />
        </Link>
      </footer>
    </>
  );
}
