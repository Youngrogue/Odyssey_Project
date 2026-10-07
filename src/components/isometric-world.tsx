export function IsometricWorld() {
  return (
    <div className="isometric-world">
      <span className="world-kicker">A LITTLE WORLD OF POSSIBILITIES</span>
      <img
        src="/illustrations/odyssey-world-1000.webp"
        srcSet="/illustrations/odyssey-world-640.webp 640w, /illustrations/odyssey-world-1000.webp 1000w"
        sizes="(max-width: 800px) 90vw, 46vw"
        width={1254}
        height={1254}
        alt="An isometric world of friends dancing, playing games and making pottery, connected by sunny yellow, violet and coral platforms."
        fetchPriority="high"
      />
      <span className="world-caption">Make room for your next first.</span>
    </div>
  );
}
