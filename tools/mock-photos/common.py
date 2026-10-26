"""Shared helpers for the mock food illustrations (800x600, top-down 'table' photos)."""
import math
import random

W, H = 800, 600


def svg(defs, body):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
        f'<defs>{defs}{COMMON_DEFS}</defs>{body}{LIGHTING}</svg>'
    )


COMMON_DEFS = """
<filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14"/></filter>
<filter id="soft-sm" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5"/></filter>
<filter id="blur2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2"/></filter>
<filter id="blur1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="0.9"/></filter>
<filter id="grain" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n"/>
  <feColorMatrix type="saturate" values="0"/>
  <feComponentTransfer><feFuncA type="table" tableValues="0 0.10"/></feComponentTransfer>
  <feComposite in2="SourceGraphic" operator="in"/>
</filter>
<radialGradient id="light" cx="0.25" cy="0.15" r="0.9">
  <stop offset="0" stop-color="#fff6e6" stop-opacity="0.28"/>
  <stop offset="0.55" stop-color="#fff6e6" stop-opacity="0"/>
</radialGradient>
<radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75">
  <stop offset="0.55" stop-color="#000" stop-opacity="0"/>
  <stop offset="1" stop-color="#000" stop-opacity="0.42"/>
</radialGradient>
"""

LIGHTING = (
    f'<rect width="{W}" height="{H}" fill="url(#light)"/>'
    f'<rect width="{W}" height="{H}" fill="url(#vignette)"/>'
    f'<rect width="{W}" height="{H}" fill="#808080" filter="url(#grain)"/>'
)


def wood(c1, c2, grain="#3a2412", opacity=0.35, freq="0.0035 0.09", seed=7):
    """Wooden table: two-tone gradient + stretched turbulence for the grain."""
    defs = f"""
<linearGradient id="woodbase" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/>
</linearGradient>
<filter id="woodgrain" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency="{freq}" numOctaves="3" seed="{seed}"/>
  <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.15"/>
</filter>
"""
    body = (
        f'<rect width="{W}" height="{H}" fill="url(#woodbase)"/>'
        f'<g opacity="{opacity}"><rect width="{W}" height="{H}" fill="{grain}" filter="url(#woodgrain)"/></g>'
    )
    # plank seams
    for y in (148, 312, 470):
        body += f'<rect x="0" y="{y}" width="{W}" height="2" fill="{grain}" opacity="0.25"/>'
    return defs, body


def stone(c1, c2, opacity=0.18, seed=5):
    defs = f"""
<linearGradient id="stonebase" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/>
</linearGradient>
<filter id="stonetex" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="4" seed="{seed}"/>
  <feColorMatrix type="saturate" values="0"/>
</filter>
"""
    body = (
        f'<rect width="{W}" height="{H}" fill="url(#stonebase)"/>'
        f'<rect width="{W}" height="{H}" filter="url(#stonetex)" opacity="{opacity}"/>'
    )
    return defs, body


def marble(seed=11):
    defs = f"""
<filter id="veins" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="turbulence" baseFrequency="0.006 0.012" numOctaves="4" seed="{seed}"/>
  <feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.45  0 0 0 0 0.48  -2.2 0 0 0 1.25"/>
</filter>
"""
    body = (
        f'<rect width="{W}" height="{H}" fill="#eceae6"/>'
        f'<rect width="{W}" height="{H}" filter="url(#veins)" opacity="0.5"/>'
    )
    return defs, body


def shadow(cx, cy, rx, ry, opacity=0.45, dx=14, dy=20):
    return (
        f'<ellipse cx="{cx + dx}" cy="{cy + dy}" rx="{rx}" ry="{ry}" fill="#000" '
        f'opacity="{opacity}" filter="url(#soft)"/>'
    )


def rng(seed):
    return random.Random(seed)


def scatter_in_circle(r, cx, cy, radius, count):
    pts = []
    for _ in range(count):
        a = r.uniform(0, math.tau)
        d = radius * math.sqrt(r.random())
        pts.append((cx + d * math.cos(a), cy + d * math.sin(a)))
    return pts


def chopsticks(x, y, angle, color="#c8a46a", length=430, edge="#8c6a38"):
    return (
        f'<g transform="translate({x},{y}) rotate({angle})">'
        f'<rect x="0" y="-6" width="{length}" height="9" rx="4" fill="#000" opacity="0.25" filter="url(#soft-sm)" transform="translate(10,14)"/>'
        f'<path d="M0,-4 L{length},-6 L{length},2 L0,1 Z" fill="{color}" stroke="{edge}" stroke-width="0.8"/>'
        f'<path d="M0,14 L{length},10 L{length},18 L0,19 Z" fill="{color}" stroke="{edge}" stroke-width="0.8"/>'
        f'</g>'
    )


def spoon(x, y, angle, scale=1.0):
    return (
        f'<g transform="translate({x},{y}) rotate({angle}) scale({scale})">'
        f'<ellipse cx="18" cy="26" rx="44" ry="30" fill="#000" opacity="0.28" filter="url(#soft-sm)"/>'
        f'<rect x="40" y="10" width="300" height="16" rx="8" fill="#000" opacity="0.22" filter="url(#soft-sm)"/>'
        f'<defs><linearGradient id="steel{x}{y}" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="0" stop-color="#f4f6f8"/><stop offset="0.5" stop-color="#b9c0c8"/><stop offset="1" stop-color="#e3e7eb"/></linearGradient></defs>'
        f'<ellipse cx="0" cy="0" rx="44" ry="30" fill="url(#steel{x}{y})" stroke="#9aa3ad" stroke-width="1.2"/>'
        f'<ellipse cx="-6" cy="-6" rx="30" ry="17" fill="#ffffff" opacity="0.45"/>'
        f'<path d="M40,-5 L330,-8 Q340,0 330,8 L40,6 Z" fill="url(#steel{x}{y})" stroke="#9aa3ad" stroke-width="1"/>'
        f'</g>'
    )


def napkin(x, y, w, h, angle, color="#efe9df", stripe="#c9bfae"):
    stripes = "".join(
        f'<rect x="0" y="{sy}" width="{w}" height="3" fill="{stripe}" opacity="0.7"/>' for sy in (14, 22, h - 25, h - 17)
    )
    return (
        f'<g transform="translate({x},{y}) rotate({angle})">'
        f'<rect x="8" y="12" width="{w}" height="{h}" rx="6" fill="#000" opacity="0.22" filter="url(#soft-sm)"/>'
        f'<rect x="0" y="0" width="{w}" height="{h}" rx="6" fill="{color}"/>'
        f'{stripes}'
        f'</g>'
    )
