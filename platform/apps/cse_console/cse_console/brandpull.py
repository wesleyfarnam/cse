"""Brand extraction from a federation's existing website.

Powers the "give it the domain, pull the branding" action in the setup wizard:
the operator enters the federation's public site, we fetch it and SUGGEST a
primary color + fonts (+ a logo URL) to pre-fill the Branding step. Always
operator-reviewable — these are suggestions, not gospel.

Signals used (most reliable first):
  - <meta name="theme-color">        (an explicit brand color when present)
  - Google Fonts <link> families      (reliable font signal)
  - hex/rgb colors in inline styles + <style> blocks (frequency + saturation)
  - font-family declarations
  - logo: <link rel~=icon> / og:image / an <img> that looks like a logo

Deliberately dependency-light (stdlib + requests, which the bench already has):
no headless browser, no Pillow. Color extraction is heuristic by nature.

SECURITY: fetches an operator-supplied URL server-side, so it guards against SSRF
(public http/https only; private/loopback/link-local IPs blocked), with a short
timeout and a response-size cap.
"""

import re
import socket
import ipaddress
import colorsys
from urllib.parse import urlparse, urljoin

import frappe

_TIMEOUT = 6
_MAX_BYTES = 2_000_000
_SAFE_SCHEMES = {"http", "https"}


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------
@frappe.whitelist()
def pull_branding(url: str) -> dict:
    """Fetch `url` and return suggested brand tokens for the Branding step."""
    url = (url or "").strip()
    if not re.match(r"^https?://", url, re.I):
        url = "https://" + url
    _assert_public(url)

    html = _fetch(url)
    colors = extract_colors(html)
    fonts = extract_fonts(html)
    primary = colors[0] if colors else None
    secondary = _pick_secondary(colors, primary)

    return {
        "source": url,
        # Full brand-token set — every --cse-* colour, not just the primary.
        "primary": primary,
        "primary_hover": _shade(primary, -0.14) if primary else None,
        "primary_dark": _shade(primary, 0.18) if primary else None,
        "link": secondary,          # secondary / accent (e.g. the blue in a red+blue brand)
        "navy": _pick_dark(colors) or "#131C3F",   # dark chrome / sidebar
        "font_app": fonts.get("app"),
        "font_display": fonts.get("display"),
        "logo_url": extract_logo(html, url),
        "palette": colors[:6],
        "note": "Suggested from the site — review before saving.",
    }


# ---------------------------------------------------------------------------
# Extraction (pure functions — unit-testable without network)
# ---------------------------------------------------------------------------
_NEUTRAL_S = 0.12   # below this saturation = treat as grey/neutral
_HEX_RE = re.compile(r"#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b")
_RGB_RE = re.compile(r"rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})", re.I)
_THEME_RE = re.compile(r'<meta[^>]+name=["\']theme-color["\'][^>]+content=["\']([^"\']+)', re.I)


def extract_colors(html: str) -> list:
    """Return brand-candidate hex colors, most brand-like first.

    theme-color wins; then colors ranked by (frequency x saturation), with
    near-white / near-black / greys filtered out and near-duplicates merged.
    """
    counts = {}

    def add(hexv, weight=1):
        h = _norm_hex(hexv)
        if h:
            counts[h] = counts.get(h, 0) + weight

    theme = _THEME_RE.search(html)
    if theme:
        add(theme.group(1), weight=40)  # strong, explicit brand signal

    for m in _HEX_RE.finditer(html):
        add("#" + m.group(1))
    for m in _RGB_RE.finditer(html):
        add(_rgb_to_hex(int(m.group(1)), int(m.group(2)), int(m.group(3))))

    scored = []
    for h, freq in counts.items():
        r, g, b = _hex_to_rgb(h)
        _, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        if s < _NEUTRAL_S or v < 0.12 or v > 0.96:
            continue  # grey / near-black / near-white — not a brand accent
        scored.append((freq * (0.4 + s), h))
    scored.sort(reverse=True)

    out = []
    for _, h in scored:
        if all(_dist(h, k) > 40 for k in out):  # merge near-duplicates
            out.append(h)
    return out


_GF_RE = re.compile(r"fonts\.googleapis\.com/css2?\?([^\"']+)", re.I)
_FAMILY_RE = re.compile(r"family=([^&:]+)", re.I)
_FF_RE = re.compile(r"font-family\s*:\s*([^;}\"']+)", re.I)
_CONDENSED = ("condensed", "narrow", "oswald", "anton", "saira", "bebas", "teko")


def extract_fonts(html: str) -> dict:
    """Suggest an app (body) font and a display (heading) font."""
    families = []
    for link in _GF_RE.finditer(html):
        for fam in _FAMILY_RE.findall(link.group(1)):
            families.append(fam.replace("+", " ").strip())
    for m in _FF_RE.finditer(html):
        first = m.group(1).split(",")[0].strip().strip("'\"")
        if first and first.lower() not in ("inherit", "initial", "sans-serif", "serif"):
            families.append(first)

    seen, ordered = set(), []
    for f in families:
        k = f.lower()
        if k not in seen:
            seen.add(k)
            ordered.append(f)

    display = next((f for f in ordered if any(c in f.lower() for c in _CONDENSED)), None)
    app = next((f for f in ordered if f != display), None)
    return {"app": app, "display": display, "all": ordered[:8]}


_LOGO_IMG_RE = re.compile(r'<img[^>]+(?:class|alt|src)=["\'][^"\']*logo[^"\']*["\'][^>]*>', re.I)
_SRC_RE = re.compile(r'src=["\']([^"\']+)', re.I)
_ICON_RE = re.compile(r'<link[^>]+rel=["\'][^"\']*icon[^"\']*["\'][^>]*>', re.I)
_HREF_RE = re.compile(r'href=["\']([^"\']+)', re.I)
_OG_RE = re.compile(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)', re.I)


def extract_logo(html: str, base_url: str):
    m = _LOGO_IMG_RE.search(html)
    if m:
        s = _SRC_RE.search(m.group(0))
        if s:
            return urljoin(base_url, s.group(1))
    m = _OG_RE.search(html)
    if m:
        return urljoin(base_url, m.group(1))
    m = _ICON_RE.search(html)
    if m:
        h = _HREF_RE.search(m.group(0))
        if h:
            return urljoin(base_url, h.group(1))
    return urljoin(base_url, "/favicon.ico")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _assert_public(url: str):
    p = urlparse(url)
    if p.scheme.lower() not in _SAFE_SCHEMES or not p.hostname:
        frappe.throw("Enter a public http(s) website URL.")
    try:
        addrs = socket.getaddrinfo(p.hostname, None)
    except Exception:
        frappe.throw("Could not resolve that domain.")
    for res in addrs:
        ip = ipaddress.ip_address(res[4][0])
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
            frappe.throw("That address is not allowed.")


def _fetch(url: str) -> str:
    import requests
    r = requests.get(
        url, timeout=_TIMEOUT, stream=True,
        headers={"User-Agent": "CSE-BrandPull/1.0"},
    )
    r.raise_for_status()
    chunk = r.raw.read(_MAX_BYTES, decode_content=True) or b""
    return chunk.decode(r.encoding or "utf-8", errors="ignore")


def _norm_hex(v: str):
    v = v.strip()
    m = _HEX_RE.match(v if v.startswith("#") else "#" + v)
    if not m:
        return None
    h = m.group(1)
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return "#" + h.upper()


def _hex_to_rgb(h):
    h = h.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def _rgb_to_hex(r, g, b):
    return "#{:02X}{:02X}{:02X}".format(max(0, min(255, r)), max(0, min(255, g)), max(0, min(255, b)))


def _dist(a, b):
    ra, ga, ba = _hex_to_rgb(a)
    rb, gb, bb = _hex_to_rgb(b)
    return abs(ra - rb) + abs(ga - gb) + abs(ba - bb)


def _shade(h, amt):
    """Lighten (amt>0) or darken (amt<0) a hex color by amt fraction."""
    r, g, b = _hex_to_rgb(h)
    if amt < 0:
        r, g, b = (int(c * (1 + amt)) for c in (r, g, b))
    else:
        r, g, b = (int(c + (255 - c) * amt) for c in (r, g, b))
    return _rgb_to_hex(r, g, b)


def _pick_dark(colors):
    """A dark chrome color (navy-like): darkest of the palette, else derived."""
    best = None
    for h in colors:
        r, g, b = _hex_to_rgb(h)
        _, _, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        if v < 0.35 and (best is None or v < best[0]):
            best = (v, h)
    return best[1] if best else None


def _hue(h):
    r, g, b = _hex_to_rgb(h)
    return colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)[0]


def _pick_secondary(colors, primary):
    """A secondary/accent color: the palette entry whose hue is most different
    from the primary (e.g. the blue in a red+blue brand). Skips near-dark chrome
    so it doesn't just return the navy. Falls back to the primary's complement."""
    if not primary or not colors:
        return None
    ph = _hue(primary)
    best = None
    for h in colors[1:]:
        r, g, b = _hex_to_rgb(h)
        _, _, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        if v < 0.30:
            continue  # that's the dark chrome, not a secondary accent
        d = abs(_hue(h) - ph)
        d = min(d, 1 - d)  # circular hue distance
        if d > 0.08 and (best is None or d > best[0]):
            best = (d, h)
    if best:
        return best[1]
    # fallback: rotate the primary hue ~150° for a distinct accent
    r, g, b = _hex_to_rgb(primary)
    hh, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    r2, g2, b2 = colorsys.hsv_to_rgb((hh + 0.42) % 1.0, max(s, 0.5), max(v, 0.6))
    return _rgb_to_hex(int(r2 * 255), int(g2 * 255), int(b2 * 255))
