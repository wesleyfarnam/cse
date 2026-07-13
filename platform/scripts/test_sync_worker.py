"""Unit tests for the pure logic of sync_worker.

    python3 test_sync_worker.py
Side-effecting bits are driven through Runner(dry_run=True), so sweep() runs
end-to-end here with no bench and no sites.
"""

import unittest

import console_worker as cw
import sync_worker as s


class TestParseActiveList(unittest.TestCase):
	def test_valid(self):
		out = (
			"bench noise\n"
			+ "FED|" + cw.b64e("Acme Fed") + "|" + cw.b64e("acme.staging.test") + "\n"
			+ "FED|" + cw.b64e("Bravo") + "|" + cw.b64e("bravo.staging.test") + "\n"
			+ "None\n"
		)
		feds = s.parse_active_list(out)
		self.assertEqual(len(feds), 2)
		self.assertEqual(feds[0], {"name": "Acme Fed", "hostname": "acme.staging.test"})
		self.assertEqual(feds[1]["hostname"], "bravo.staging.test")

	def test_empty(self):
		self.assertEqual(s.parse_active_list("no feds\nNone\n"), [])
		self.assertEqual(s.parse_active_list(""), [])

	def test_ignores_malformed(self):
		self.assertEqual(s.parse_active_list("FED|onlytwo"), [])


class TestParseUserCount(unittest.TestCase):
	def test_valid(self):
		self.assertEqual(s.parse_user_count("noise\nUSER_COUNT|42\n"), 42)
		self.assertEqual(s.parse_user_count("USER_COUNT|0"), 0)

	def test_absent(self):
		self.assertIsNone(s.parse_user_count("nothing here\n"))
		self.assertIsNone(s.parse_user_count(""))

	def test_non_numeric(self):
		self.assertIsNone(s.parse_user_count("USER_COUNT|lots"))


class _StubRunner:
	"""Feeds canned (rc, out) per dotted-path / script so sweep() can be driven."""

	def __init__(self, responses):
		self.responses = responses
		self.dry_run = False
		self.calls = []

	def run(self, argv, env=None, cwd=None):
		joined = " ".join(argv)  # dotted path / script path may be followed by --kwargs
		self.calls.append(joined)
		for needle, resp in self.responses.items():
			if needle in joined:
				return resp
		return 1, f"unexpected call: {argv}\n"


class TestSweep(unittest.TestCase):
	def test_dry_run_walks_the_path(self):
		synced, skipped = s.sweep(s.Runner(dry_run=True))
		self.assertEqual((synced, skipped), (1, 0))

	def test_syncs_reachable_and_skips_unreachable(self):
		one = cw.b64e("One")
		two = cw.b64e("Two")
		runner = _StubRunner({
			"list_active_federations": (
				0,
				"FED|" + one + "|" + cw.b64e("one.staging.test") + "\n"
				+ "FED|" + two + "|" + cw.b64e("two.staging.test") + "\n",
			),
			# count_users.py is invoked as `... run_on_site.py <path>/count_users.py`
			"count_users.py": (0, "USER_COUNT|7\n"),
			"set_federation_sync": (0, "SYNC_SET\n"),
		})
		# First fed's tenant reachable (7 users), so it syncs. Force the second to
		# look unreachable by making its count read fail.
		orig = s.tenant_user_count

		def fake_count(r, host):
			return 7 if host == "one.staging.test" else None

		s.tenant_user_count = fake_count
		try:
			synced, skipped = s.sweep(runner)
		finally:
			s.tenant_user_count = orig
		self.assertEqual(synced, 1)
		self.assertEqual(skipped, 1)


if __name__ == "__main__":
	unittest.main(verbosity=2)
