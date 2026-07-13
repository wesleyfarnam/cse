"""Shared primitives for the CSE host-side console workers.

Both provision_worker.py (queue -> live site) and sync_worker.py (Active site ->
fresh user_count/last_synced) talk to the CSE Console the same way: shell out to
`bench execute` of the non-whitelisted helpers in cse_console.console_api, which
print base64-delimited lines. The config and the subprocess wrapper live here so
the two workers can't drift apart.
"""

import base64
import json
import os
import subprocess

# --------------------------------------------------------------------------- #
# Config (all overridable via env)
# --------------------------------------------------------------------------- #
BENCH = os.environ.get("BENCH", "bench")
BENCH_DIR = os.environ.get("BENCH_DIR", "/home/frappe/frappe-bench")
CONSOLE_SITE = os.environ.get("CONSOLE_SITE", "console.combatsportseducation.com")
SCRIPTS_DIR = os.environ.get("SCRIPTS_DIR", os.path.dirname(os.path.abspath(__file__)))
PY = os.environ.get("PY", os.path.join(BENCH_DIR, "env", "bin", "python"))

# Frappe "Code" fields hold plenty; still cap so a runaway log can't bloat the
# row. Keep the tail — that's where failures surface.
LOG_CAP = int(os.environ.get("LOG_CAP", "60000"))


# --------------------------------------------------------------------------- #
# Pure helpers (no side effects)
# --------------------------------------------------------------------------- #
def b64e(s):
	return base64.b64encode((s or "").encode()).decode()


def b64d(s):
	return base64.b64decode(s).decode("utf-8", "replace")


def build_execute_cmd(site, dotted, kwargs=None):
	"""argv for `bench --site SITE execute DOTTED [--kwargs JSON]`."""
	cmd = [BENCH, "--site", site, "execute", dotted]
	if kwargs:
		cmd += ["--kwargs", json.dumps(kwargs)]
	return cmd


def cap_log(text, cap=LOG_CAP):
	if len(text) <= cap:
		return text
	return "…(truncated)…\n" + text[-cap:]


def site_script_cmd(site, script):
	"""argv to run a configure_*/create_*/count_* script on a site via run_on_site.py."""
	return [PY, os.path.join(SCRIPTS_DIR, "run_on_site.py"), os.path.join(SCRIPTS_DIR, script)]


# --------------------------------------------------------------------------- #
# Side-effecting layer
# --------------------------------------------------------------------------- #
class Runner:
	"""Wraps subprocess so --dry-run can short-circuit every external call."""

	def __init__(self, dry_run=False):
		self.dry_run = dry_run

	def run(self, argv, env=None, cwd=None):
		"""Run argv; return (returncode, combined_output)."""
		printable = " ".join(argv)
		if self.dry_run:
			return 0, f"[dry-run] {printable}\n"
		full_env = dict(os.environ)
		if env:
			full_env.update(env)
		proc = subprocess.run(
			argv,
			cwd=cwd or BENCH_DIR,
			env=full_env,
			stdout=subprocess.PIPE,
			stderr=subprocess.STDOUT,
			text=True,
		)
		return proc.returncode, proc.stdout
