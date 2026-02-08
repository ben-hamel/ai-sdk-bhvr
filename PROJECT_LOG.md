# Project Log

## 2026-02-08
- Updated database connection settings to use `sslmode=verify-full` to keep strict TLS behavior and avoid upcoming pg/libpq SSL-mode semantic changes. Neon does not include this by default in generated connection strings, so production secrets may need to be updated explicitly.
- Fixed Cloudflare Pages preview builds by setting the correct Bun version in the Preview environment settings. The version was already correct for Production, but Preview uses a separate settings page, which caused the mismatch to be easy to miss.

## 2026-02-07
- Fixed Cloudflare migration during the build step using build-time variables.
