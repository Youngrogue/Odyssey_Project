import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Public pages are immutable per build; private routes are never cached.
// No R2, ISR, image-transform or paid storage binding is required.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
