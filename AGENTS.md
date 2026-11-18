# Development and publishing

- Work on the `dev` branch. Commit and push all future changes to `dev`.
- Deploy changes only to the Cloudflare `dev` Preview. Do not push to `main`, merge into `main`, or deploy production unless the user explicitly changes this instruction.
- Keep Preview data in `acts-of-good-preview` (`d729bd01-d7c2-40dc-bdd0-4f14fa5b49c6`) in account `7f42bd46597bab9181b7a128a695f2cd`.
- Never bind the Preview to the production database or production custom domains.
- Use `npm run build:preview` and `npm run deploy:preview`, or `npm run deploy` for both steps.
- Keep the original gold flower. The academy logo and Sunnah.com search features have been removed at the user's request.
