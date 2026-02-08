# Project Log

## 2026-02-08
- Updated database connection settings to use `sslmode=verify-full` to keep strict TLS behavior and avoid upcoming pg/libpq SSL-mode semantic changes. Neon does not include this by default in generated connection strings, so production secrets may need to be updated explicitly.

## 2026-02-07
- Fixed Cloudflare migration during the build step using build-time variables.
