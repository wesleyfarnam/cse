# cse_branding

Per-federation login page for the CSE platform.

Drops a custom `www/login.html` that takes precedence over Frappe's framework
default. The template reads its values from the `CSE Login Branding` Single
doctype, so a new federation customises by editing one form — no template
edits, no source forks.

Configurable: split-screen background (video *or* image), logo, primary +
accent colors, the eyebrow / wordmark / hero copy, and the footer line.
