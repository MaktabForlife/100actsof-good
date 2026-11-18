# Cloudflare for SaaS custom hostname

Prepared configuration; activation and live validation are pending Cloudflare checkout approval.

The existing Worker and D1 database serve both hostnames. The academy hostname is a Cloudflare for SaaS custom hostname in the provider zone; it is not a separate Worker custom domain in the academy account.

| Resource | Configuration |
| --- | --- |
| Provider account | `7f42bd46597bab9181b7a128a695f2cd` |
| Provider zone | `hifz-helper.app` / `669ab582cd4f2dd66d046bab1103a293` |
| Worker | `acts-of-good` |
| Provider hostname and fallback origin | `100actsofgood.hifz-helper.app` |
| Originless provider DNS | Proxied `AAAA` → `100::` (managed by Worker custom domain) |
| SaaS custom hostname | `100actsofgood.ummabbadacademy.app` |
| Customer zone | `ummabbadacademy.app` / `28f9da77d7124e6343cfee405af7bd41` |
| Customer account | `c9a3e355b3d7a795880b1d36a1dbe123` |
| Customer DNS | Proxied `CNAME` → `100actsofgood.hifz-helper.app` |
| Certificate | Managed DV, HTTP validation |

## Routing

The Worker custom domain keeps the provider address working. Two exact Worker routes in the provider zone select this application for SaaS traffic:

- `100actsofgood.hifz-helper.app/*` covers the proxied customer CNAME (O2O).
- `100actsofgood.ummabbadacademy.app/*` covers a DNS-only customer CNAME.

The routes are declared in `wrangler.jsonc`. No zone-wide wildcard route is needed, so other applications on `hifz-helper.app` keep their existing routing.

## Activation and validation

1. Activate Cloudflare for SaaS in the provider zone after the account owner approves Cloudflare's checkout terms and usage billing authorization. The displayed base charge is $0, with 100 custom hostnames included; additional usage is subject to Cloudflare pricing.
2. Set the provider hostname above as the SaaS fallback origin and wait for Active.
3. Add the academy hostname with managed DV and HTTP certificate validation. Publish any ownership validation records Cloudflare requests in the customer zone.
4. Deploy the exact Worker routes. Keep the customer CNAME pointed at the provider address.
5. Verify both hostname and certificate statuses are Active, then verify the page, PDF assets, and `/api/logbook` on the academy address.

## Data

Both hostnames use the same `acts-of-good-production` database (`35e77ced-b8c0-4fdd-bbb7-3c52d5a0e720`) and the same three shared zone logbooks. Browser localStorage belongs to each origin: users may need to select a zone again on the academy hostname, and unsaved drafts from the provider hostname remain in that browser's storage for the original address.

## References

- https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/start/enable/
- https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/start/advanced-settings/worker-as-origin/
- https://developers.cloudflare.com/cloudflare-for-platforms/workers-for-platforms/configuration/hostname-routing/
