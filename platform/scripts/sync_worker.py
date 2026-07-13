"""CSE sync worker — refreshes user_count / last_synced for live federations.

The console list view flags each federation as "Synced Nm ago" (green), "Stale"
(>12m, orange) or "Never synced" (red) from the `last_synced` field, and shows
`user_count`. Provisioning writes neither, so without this worker every Active
federation reads "Never synced" forever.

For each Active federation this worker asks the tenant site for its current
member count and stamps user_count + last_synced back on the console row. A
tenant that is unreachable is simply skipped — its row goes stale, which is
exactly the signal the console is designed to show — never marked Error (that
status is reserved for provisioning failures).

Console <-> worker transport mirrors provision_worker: `bench execute` of the
non-whitelisted cse_console.console_api helpers:
  - list_active_federations  -> prints  FED|b64name|b64hostname  (one per line)
  - set_federation_sync      <- name_b64, user_count

Usage (as the frappe user):
    CONSOLE_SITE=console.combatsportseducation.com \
    python3 sync_worker.py             # sync every Active federation once
    python3 sync_worker.py --loop      # keep syncing every SYNC_INTERVAL secs
    python3 sync_worker.py --dry-run   # print the steps, run nothing

The natural deployment is `--oneshot` behaviour on a cron (e.g. every 10 min);
`--loop` is for a dedicated worker box.
"""

import os
import sys
import time

from console_worker import (
	BENCH_DIR,
	CONSOLE_SITE,
	Runner,
	b64d,
	b64e,
	build_execute_cmd,
	site_script_cmd,
)

# Between full sweeps in --loop mode. Sweeps are cheap (one bench call per site)
# but stay well under the console's 12-minute staleness threshold.
SYNC_INTERVAL = int(os.environ.get("SYNC_INTERVAL", "300"))


# --------------------------------------------------------------------------- #
# Pure helpers (no side effects — unit-tested in test_sync_worker.py)
# --------------------------------------------------------------------------- #
def parse_active_list(stdout):
	"""Parse the FED|b64name|b64hostname lines from list_active_federations.

	Returns a list of {name, hostname} dicts (empty if none are Active).
	"""
	feds = []
	for line in stdout.splitlines():
		line = line.strip()
		if line.startswith("FED|"):
			parts = line.split("|")
			if len(parts) != 3:
				continue
			feds.append({"name": b64d(parts[1]), "hostname": b64d(parts[2])})
	return feds


def parse_user_count(stdout):
	"""Extract the integer from a USER_COUNT|<n> line, or None if absent/bad."""
	for line in stdout.splitlines():
		line = line.strip()
		if line.startswith("USER_COUNT|"):
			try:
				return int(line.split("|", 1)[1])
			except (ValueError, IndexError):
				return None
	return None


# --------------------------------------------------------------------------- #
# Side-effecting layer
# --------------------------------------------------------------------------- #
def fetch_active(runner):
	rc, out = runner.run(build_execute_cmd(CONSOLE_SITE, "cse_console.console_api.list_active_federations"))
	if rc != 0:
		raise RuntimeError(f"list_active_federations failed (rc={rc}):\n{out}")
	if runner.dry_run:
		# Nothing real to enumerate in a dry run; exercise the sync path once.
		return [{"name": "Example Federation", "hostname": "example.staging.test"}]
	return parse_active_list(out)


def tenant_user_count(runner, host):
	"""Return the tenant's member count, or None if it couldn't be read."""
	env = {"SITE": host, "BENCH_SITES": os.path.join(BENCH_DIR, "sites")}
	rc, out = runner.run(site_script_cmd(host, "count_users.py"), env=env)
	if runner.dry_run:
		return 0
	if rc != 0:
		sys.stderr.write(f"WARN: count_users failed on {host} (rc={rc}):\n{out}\n")
		return None
	return parse_user_count(out)


def report_sync(runner, name, user_count):
	kwargs = {"name_b64": b64e(name), "user_count": int(user_count)}
	rc, out = runner.run(build_execute_cmd(CONSOLE_SITE, "cse_console.console_api.set_federation_sync", kwargs))
	if rc != 0:
		sys.stderr.write(f"WARN: could not set sync for {name} (rc={rc}):\n{out}\n")
		return False
	return True


def sweep(runner):
	"""Sync every Active federation once. Returns (synced, skipped) counts."""
	feds = fetch_active(runner)
	synced = skipped = 0
	for fed in feds:
		count = tenant_user_count(runner, fed["hostname"])
		if count is None:
			# Tenant unreachable: leave the row to go stale, don't touch status.
			print(f"[sync] {fed['name']} ({fed['hostname']}) unreachable — left stale", flush=True)
			skipped += 1
			continue
		if report_sync(runner, fed["name"], count):
			print(f"[sync] {fed['name']} -> {count} users", flush=True)
			synced += 1
		else:
			skipped += 1
	return synced, skipped


def main(argv):
	dry_run = "--dry-run" in argv
	loop = "--loop" in argv and not dry_run
	runner = Runner(dry_run=dry_run)

	if not loop:
		synced, skipped = sweep(runner)
		print(f"[sync] done — {synced} synced, {skipped} skipped", flush=True)
		return 0

	print(f"[sync] sweeping {CONSOLE_SITE} every {SYNC_INTERVAL}s", flush=True)
	while True:
		try:
			sweep(runner)
		except Exception as e:  # noqa: BLE001 - keep the loop alive across transient errors
			sys.stderr.write(f"[sync] sweep error: {e}\n")
		time.sleep(SYNC_INTERVAL)


if __name__ == "__main__":
	sys.exit(main(sys.argv[1:]))
