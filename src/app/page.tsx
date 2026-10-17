import { Brand } from "@/components/brand";
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
    "We’re building Odyssey and haven’t announced a launch date. The waitlist brings you a useful welcome, meaningful progress updates and a launch notification.",
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
    "Confirm your email to receive Founding Explorer recognition and a badge you can save and share. You’ll also get a personal invite link, meaningful progress updates and a launch notification. This celebrates being here early; it is separate from the app’s activity ranks and XP.",
  ],
  [
    "How can I bring my friends?",
    "Confirm your waitlist email to get your own invite code and shareable link. Send it to people who’d enjoy Odyssey. Your private invite page shows how many new signups have confirmed through your link, without sharing anyone’s email address. Invites are separate from activity XP and competition.",
  ],
  [
    "What will you email me?",
    "A confirmation email, then a welcome with ideas and what to expect. After that, meaningful project updates and a launch notification. No app account, broader newsletter or partner mailing list is created. You can unsubscribe.",
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
              YOUR NEXT CHAPTER · COMING SOON
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
              Turn “we should” into “we did”, with a Bucket list for all the
              things you’ve been meaning to do.
            </p>
            <p className="hero-tagline">
              At home or out in the world. It all counts.
            </p>
            <div id="waitlist" className="waitlist-anchor">
              <p className="signup-intro">Get in early. Bring your people.</p>
              <WaitlistForm />
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
                <h3>A little badge for a big beginning.</h3>
                <p>
                  Confirm your email to become a Founding Explorer. Get a badge
                  to save and share, a proper welcome and ideas to try.
                </p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Your people. Your invite.</h3>
                <p>
                  Get a personal code and link to share. Keep track of confirmed
                  invites on a private page, just for you.
                </p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Know when it’s time.</h3>
                <p>
                  Meaningful progress updates and a launch notification, so
                  you’re ready for your next first. Unsubscribe whenever you
                  like.
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
