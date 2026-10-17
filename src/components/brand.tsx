import { brand } from "@/lib/brand";

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <a className="brand" href="/" aria-label={`${brand.name} home`}>
      {/* The supplied mark is reused with its original viewBox and aspect ratio. */}
      <img
        src={`/brand/open-loop-${inverse ? "yellow" : "ink"}.svg`}
        alt=""
        width="44"
        height="44"
      />
      <span>{brand.wordmark}</span>
    </a>
  );
}
