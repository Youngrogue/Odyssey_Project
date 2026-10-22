import { Brand } from "@/components/brand";
import { SiteNavigation } from "@/components/site-navigation";
import { Icon } from "@/components/icons";
import { IsometricWorld } from "@/components/isometric-world";
import { Teaser } from "@/components/teaser";
import { WaitlistForm } from "@/components/waitlist-form";
import { DiscoveryPlayground } from "@/components/discovery-playground";
import { CommunityPreview } from "@/components/community-preview";
import { PartnerInvitation } from "@/components/partner-invitation";
import { publicSite } from "@/lib/public-site";
import { brand } from "@/lib/brand";
import { landingMetadata } from "@/lib/site-metadata";
export const generateMetadata = landingMetadata;
export const dynamic = "force-static";
const questions = [
  [
    `What is ${brand.name}?`,
    "An upcoming activity-discovery and personal Bucket-list app. Find things to try, discover communities around your interests, and keep track of the experiences you want to have.",
  ],
  [
    "Can I start my Bucket list now?",
    "Yes. Save an activity, add your own idea and check things off right here. Your list stays on this device, and you can download a copy to keep. When Odyssey launches, you’ll have more ways to plan, track and share your adventures.",
  ],
  [
    "When will the app be ready?",
    "We’re building Odyssey and haven’t announced a launch date. Join the waitlist to hear when Odyssey launches.",
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
    "How will ranks and leaderboards work?",
    "Build a different rank in every interest: F, E, D, C, B, A and S. F means Getting started, and Ultimate S celebrates completing a whole trophy edition. Keep growing your personal collection, or join activity leaderboards for friendly competition. Taking part is always your choice; joining the waitlist won’t put you on a public board.",
  ],
  [
    "What do early birds get?",
    "Confirm your email to be among the first to hear when Odyssey launches.",
  ],
  [
    "How can I bring my friends?",
    "Share this landing page with people who would enjoy Odyssey. Invitations and accounts are planned for the future app.",
  ],
  [
    "What will you email me?",
    "One confirmation email, followed by a launch notification when Odyssey is ready. No app account, broader newsletter or partner mailing list is created. You can unsubscribe.",
  ],
];
export default function HomePage() {
  const partnerContact = publicSite.contactEmail;
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header shell">
        <Brand />
        <SiteNavigation />
      </header>
      <main id="main">
        <section className="hero shell" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="status-dot" />
              YOUR NEXT CHAPTER · COMING SOON
            </p>
            <h1 id="hero-title">
              A little curiosity.
              <br />
              <span className="highlight-text">A lot more life.</span>
            </h1>
            <p className="hero-description">
              Salsa nights, new cuisines, a quiet game at home. Discover things
              to do and people to do them with. Start with your own Bucket list.
            </p>
            <p className="hero-tagline">
              At home or out in the world. It all counts.
            </p>
            <div id="waitlist" className="waitlist-anchor">
              <p className="signup-intro">
                Join the Odyssey waitlist and be among the first to hear when we
                launch.
              </p>
              <WaitlistForm />
            </div>
            <div className="hero-first-action">
              <a className="hero-explore text-link" href="#new-quest">
                Start my Bucket list <Icon name="arrow" />
              </a>
              <span>No account needed</span>
            </div>
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
                <p className="eyebrow">MAKE ROOM FOR YOUR NEXT FIRST</p>
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
                    Meet Odyssey: discover ideas, make a personal Bucket list,
                    and explore home activities, new tastes and communities. The
                    closing invitation is to join the waitlist. The film uses a
                    musical soundtrack and on-screen text.
                  </p>
                </details>
              </div>
              <div className="launch-film-frame">
                <Teaser film="launch" />
                <span className="launch-film-note">YOUR LIFE. MORE PLAY.</span>
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
                    done. Collect experiences, grow your interests and earn
                    trophies along the way. Taste food from around the world:
                    choose your own countries and cuisines.
                  </p>
                </details>
              </div>
            </details>
          </div>
        </section>
        <section
          className="early-access-section shell section-space"
          aria-labelledby="early-access-title"
        >
          <div className="early-access-heading">
            <p className="eyebrow">
              GOOD THINGS START WITH A FEW CURIOUS PEOPLE
            </p>
            <h2 id="early-access-title">
              Be here for
              <br />
              <span className="serif-note">the beginning.</span>
            </h2>
            <p>
              Get the first chapter in your inbox. Then bring the people you’d
              love to make memories with.
            </p>
            <a className="button button-yellow" href="#waitlist">
              Join the waitlist <Icon name="arrow" />
            </a>
          </div>
          <ol className="early-access-steps">
            <li>
              <span>01</span>
              <div>
                <h3>Start with your email.</h3>
                <p>
                  Enter your email and we’ll send a link to confirm your place.
                </p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Confirm your place.</h3>
                <p>
                  Choose Confirm my email in your email to join the waitlist.
                </p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Know when it’s time.</h3>
                <p>
                  A launch notification, so you’re ready for your next first.
                  Unsubscribe whenever you like.
                </p>
              </div>
            </li>
          </ol>
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
                        <a href="/privacy">Read the privacy notice.</a>
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
          <a
            className="text-link"
            href={`${brand.surveyUrl}?source=site`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Help shape Odyssey: take the 3-minute survey
            <Icon name="arrow" />
          </a>
          <Icon name="spark" className="invitation-spark" />
        </section>
      </main>
      <footer className="site-footer shell">
        <Brand />
        <span>A little curiosity. A lot more life.</span>
        <a href="/privacy">
          Privacy & contact
          <Icon name="arrowUp" />
        </a>
      </footer>
    </>
  );
}
