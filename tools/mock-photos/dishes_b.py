"""Pho, mulhoe, padthai, hanok tea."""
import math
from common import (W, H, svg, wood, stone, marble, shadow, rng, scatter_in_circle, chopsticks, spoon, napkin)


def leaf(x, y, angle, length, width, fill, vein="#2f6f1f"):
    return (
        f'<g transform="translate({x:.1f},{y:.1f}) rotate({angle:.0f})">'
        f'<path d="M0,0 Q{length * 0.45:.1f},{-width:.1f} {length:.1f},0 Q{length * 0.45:.1f},{width:.1f} 0,0 Z" fill="{fill}"/>'
        f'<path d="M2,0 L{length - 4:.1f},0" stroke="{vein}" stroke-width="1.2" opacity="0.6"/>'
        f'</g>'
    )


def lime_wedge(x, y, angle, size=1.0):
    return (
        f'<g transform="translate({x},{y}) rotate({angle}) scale({size})">'
        f'<path d="M-50,0 A50,50 0 0 1 50,0 Z" fill="#000" opacity="0.3" filter="url(#soft-sm)" transform="translate(6,10)"/>'
        f'<path d="M-50,0 A50,50 0 0 1 50,0 Z" fill="#5c9e2e"/>'
        f'<path d="M-43,0 A43,43 0 0 1 43,0 Z" fill="#e3f1a8"/>'
        + ''.join(
            f'<path d="M0,0 L{40 * math.cos(math.radians(a)):.1f},{-40 * math.sin(math.radians(a)):.1f}" stroke="#f6fbd8" stroke-width="2.5"/>'
            for a in range(15, 180, 30))
        + '<path d="M-50,0 L50,0" stroke="#f6fbd8" stroke-width="3"/></g>'
    )


# ---------------------------------------------------------------- pho
def pho():
    r = rng(33)
    d1, bg = wood('#5b3b26', '#2c1b10', grain='#120a05', opacity=0.5, seed=21)
    d2 = """
<radialGradient id="bowl" cx="0.42" cy="0.38" r="0.65"><stop offset="0" stop-color="#ffffff"/><stop offset="0.85" stop-color="#e9ece9"/><stop offset="1" stop-color="#c9cfcc"/></radialGradient>
<radialGradient id="pbroth" cx="0.45" cy="0.42" r="0.6"><stop offset="0" stop-color="#e4b46a"/><stop offset="0.7" stop-color="#c9893a"/><stop offset="1" stop-color="#9b5e1f"/></radialGradient>
<linearGradient id="beef" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b98473"/><stop offset="1" stop-color="#8e5c4d"/></linearGradient>
<clipPath id="phoclip"><circle cx="380" cy="300" r="196"/></clipPath>
"""
    cx, cy = 380, 300
    b = [bg]
    b.append(shadow(cx, cy, 238, 230, 0.6, 18, 26))
    b.append(f'<circle cx="{cx}" cy="{cy}" r="236" fill="url(#bowl)"/>')
    b.append(f'<circle cx="{cx}" cy="{cy}" r="226" fill="none" stroke="#2c5aa0" stroke-width="5"/>')
    b.append(f'<circle cx="{cx}" cy="{cy}" r="218" fill="none" stroke="#2c5aa0" stroke-width="1.5" stroke-dasharray="6 8"/>')
    b.append(f'<circle cx="{cx}" cy="{cy}" r="198" fill="url(#pbroth)"/>')
    b.append('<g clip-path="url(#phoclip)">')
    # noodles under the surface
    for k in range(34):
        x0 = cx - 190 + r.uniform(0, 380)
        y0 = cy - 190 + r.uniform(0, 380)
        path = f'M{x0:.0f},{y0:.0f} ' + ' '.join(
            f'q{r.uniform(15, 30):.0f},{r.uniform(-22, 22):.0f} {r.uniform(30, 55):.0f},{r.uniform(-8, 8):.0f}' for _ in range(4))
        b.append(f'<path d="{path}" fill="none" stroke="#f6eedd" stroke-width="7" stroke-linecap="round" opacity="0.88" transform="rotate({r.uniform(0, 180):.0f} {x0:.0f} {y0:.0f})"/>')
    b.append(f'<circle cx="{cx}" cy="{cy}" r="198" fill="#c98a3c" opacity="0.32"/>')
    # fat droplets
    for px, py in scatter_in_circle(r, cx, cy, 185, 60):
        b.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="{r.uniform(2, 6):.1f}" fill="#f4cf8a" opacity="0.6"/>')
    # beef slices
    for i, (dx, dy, a) in enumerate([(-80, -60, -20), (-30, -86, 10), (30, -70, 34), (-96, 4, 70), (60, -16, -40)]):
        b.append(f'<g transform="translate({cx + dx},{cy + dy}) rotate({a})"><path d="M-46,-26 Q0,-40 46,-24 Q54,0 44,26 Q0,36 -44,24 Q-54,0 -46,-26 Z" fill="url(#beef)" stroke="#7a4a3c" stroke-width="1.2"/><path d="M-30,-6 Q0,6 30,-8" stroke="#d9a796" stroke-width="2" fill="none" opacity="0.7"/></g>')
    # bean sprouts
    for k in range(22):
        x = cx + 20 + r.uniform(-30, 120)
        y = cy + 40 + r.uniform(-20, 110)
        a = r.uniform(0, 180)
        b.append(f'<g transform="translate({x:.0f},{y:.0f}) rotate({a:.0f})"><path d="M0,0 q20,-8 44,-2" stroke="#fbf7e8" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="46" cy="-2" rx="6" ry="4" fill="#e8e09a"/></g>')
    # herbs
    for k in range(9):
        b.append(leaf(cx - 120 + r.uniform(-30, 60), cy + 50 + r.uniform(-20, 100), r.uniform(0, 360), 58, 18, r.choice(['#3f8f2f', '#4ea53a', '#2f7a25'])))
    # onion slices + chili
    for k in range(10):
        x, y = cx + r.uniform(-120, 120), cy + r.uniform(-120, 120)
        b.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r.uniform(10, 16):.0f}" fill="none" stroke="#f7f1e8" stroke-width="3" opacity="0.85"/>')
    for k in range(6):
        x, y = cx + r.uniform(-60, 140), cy + r.uniform(-130, 40)
        b.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="9" fill="#d32f1e"/><circle cx="{x:.0f}" cy="{y:.0f}" r="5" fill="#f2b84a" opacity="0.8"/>')
    b.append('</g>')
    b.append(lime_wedge(690, 470, -30, 1.0))
    b.append(leaf(660, 120, 20, 90, 28, '#3f8f2f'))
    b.append(leaf(690, 150, -30, 80, 24, '#4ea53a'))
    b.append(spoon(640, 330, 75, 0.9))
    b.append(chopsticks(80, 560, -78, color='#3a2a1f', edge='#1a120c', length=420))
    return svg(d1 + d2, ''.join(b))


# ---------------------------------------------------------------- mulhoe (cold raw-fish soup)
def mulhoe():
    r = rng(55)
    d1, bg = stone('#8aa3ad', '#5e7883', opacity=0.22, seed=8)
    d2 = """
<radialGradient id="steelbowl" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#f4f6f8"/><stop offset="0.6" stop-color="#c3cad1"/><stop offset="1" stop-color="#8e979f"/></radialGradient>
<radialGradient id="redbroth" cx="0.45" cy="0.4" r="0.6"><stop offset="0" stop-color="#f07a52"/><stop offset="0.7" stop-color="#d9452b"/><stop offset="1" stop-color="#b12f1c"/></radialGradient>
<linearGradient id="fishslice" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fbf3ee"/><stop offset="1" stop-color="#f2d6cc"/></linearGradient>
<clipPath id="mclip"><circle cx="370" cy="300" r="200"/></clipPath>
"""
    cx, cy = 370, 300
    b = [bg]
    b.append(shadow(cx, cy, 240, 232, 0.55, 18, 26))
    b.append(f'<circle cx="{cx}" cy="{cy}" r="238" fill="url(#steelbowl)"/>')
    b.append(f'<circle cx="{cx}" cy="{cy}" r="224" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.6"/>')
    b.append(f'<circle cx="{cx}" cy="{cy}" r="202" fill="url(#redbroth)"/>')
    b.append('<g clip-path="url(#mclip)">')
    # shaved ice
    for px, py in scatter_in_circle(r, cx - 10, cy + 20, 170, 26):
        pts = ' '.join(f'{px + r.uniform(-22, 22):.0f},{py + r.uniform(-18, 18):.0f}' for _ in range(6))
        b.append(f'<polygon points="{pts}" fill="#ffffff" opacity="{r.uniform(0.35, 0.75):.2f}"/>')
    # raw fish slices fanned in a circle
    for k in range(11):
        a = k * (360 / 11) + r.uniform(-6, 6)
        rad = math.radians(a)
        x = cx + 95 * math.cos(rad)
        y = cy + 95 * math.sin(rad)
        b.append(f'<g transform="translate({x:.0f},{y:.0f}) rotate({a + 90:.0f})"><rect x="-22" y="-44" width="44" height="88" rx="14" fill="url(#fishslice)" stroke="#e7b8aa" stroke-width="1.4"/><path d="M-18,-40 Q-10,0 -18,40" stroke="#f0a090" stroke-width="3" fill="none" opacity="0.7"/></g>')
    # julienned cucumber + pear in the middle
    for k in range(34):
        x = cx + r.uniform(-50, 50)
        y = cy + r.uniform(-50, 50)
        a = r.uniform(0, 180)
        col = r.choice(['#3d8b2c', '#5fae3c', '#f4efc6', '#f1e7b0'])
        b.append(f'<rect x="{x:.0f}" y="{y:.0f}" width="54" height="6" rx="2" fill="{col}" transform="rotate({a:.0f} {x:.0f} {y:.0f})"/>')
    # perilla leaf
    b.append(leaf(cx - 40, cy - 30, -30, 110, 44, '#2f6e2a', '#1d4a1b'))
    for px, py in scatter_in_circle(r, cx, cy, 150, 70):
        b.append(f'<ellipse cx="{px:.1f}" cy="{py:.1f}" rx="2.6" ry="1.6" fill="#f6ead0" transform="rotate({r.uniform(0, 180):.0f} {px:.1f} {py:.1f})"/>')
    b.append('</g>')
    # somyeon dish
    b.append(shadow(680, 470, 92, 86, 0.5))
    b.append('<circle cx="680" cy="470" r="92" fill="#f4f2ee"/><circle cx="680" cy="470" r="78" fill="#e9e5de"/>')
    for k in range(26):
        a = r.uniform(0, 360)
        b.append(f'<ellipse cx="{680 + r.uniform(-8, 8):.0f}" cy="{470 + r.uniform(-8, 8):.0f}" rx="{r.uniform(30, 52):.0f}" ry="{r.uniform(18, 34):.0f}" fill="none" stroke="#fffdf6" stroke-width="3" transform="rotate({a:.0f} 680 470)"/>')
    b.append('<ellipse cx="680" cy="470" rx="54" ry="40" fill="none" stroke="#e4dccb" stroke-width="1"/>')
    b.append(spoon(660, 150, 160, 0.95))
    b.append(chopsticks(620, 250, 70, color='#c9ced3', edge='#8b939b', length=320))
    return svg(d1 + d2, ''.join(b))


# ---------------------------------------------------------------- pad thai on banana leaf
def padthai():
    r = rng(99)
    d1, bg = wood('#a27149', '#6e4527', grain='#2e1a0b', opacity=0.42, seed=31)
    d2 = """
<radialGradient id="plate" cx="0.42" cy="0.38" r="0.65"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d9d6cf"/></radialGradient>
<linearGradient id="banana" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3f8f34"/><stop offset="1" stop-color="#256b22"/></linearGradient>
<linearGradient id="shrimp" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f6a37c"/><stop offset="1" stop-color="#e9633a"/></linearGradient>
"""
    cx, cy = 390, 300
    b = [bg]
    # banana leaf
    b.append('<g transform="translate(400,300) rotate(-18)"><path d="M-380,-60 Q0,-250 380,-80 Q330,150 -360,190 Q-420,60 -380,-60 Z" fill="#000" opacity="0.35" filter="url(#soft)"/>'
             '<path d="M-390,-80 Q0,-270 380,-100 Q320,140 -370,170 Q-430,40 -390,-80 Z" fill="url(#banana)"/>'
             + ''.join(f'<path d="M{-360 + k * 40},{-60 + k * 3} Q{-330 + k * 40},{20} {-320 + k * 40},{140 - k * 4}" stroke="#5fae4e" stroke-width="2" fill="none" opacity="0.55"/>' for k in range(18))
             + '<path d="M-390,40 Q0,-60 380,-40" stroke="#9fd38d" stroke-width="4" fill="none" opacity="0.7"/></g>')
    b.append(shadow(cx, cy, 214, 206, 0.55, 14, 22))
    b.append(f'<circle cx="{cx}" cy="{cy}" r="212" fill="url(#plate)"/>')
    b.append(f'<circle cx="{cx}" cy="{cy}" r="170" fill="none" stroke="#cfcac0" stroke-width="2"/>')
    # noodle mound
    for k in range(70):
        x0 = cx + r.uniform(-130, 110)
        y0 = cy + r.uniform(-120, 110)
        if (x0 - cx) ** 2 + (y0 - cy) ** 2 > 140 ** 2:
            continue
        path = f'M{x0:.0f},{y0:.0f} ' + ' '.join(f'q{r.uniform(10, 22):.0f},{r.uniform(-16, 16):.0f} {r.uniform(22, 40):.0f},{r.uniform(-6, 6):.0f}' for _ in range(3))
        col = r.choice(['#d98b3c', '#e3a052', '#c97a30', '#eab066'])
        b.append(f'<path d="{path}" fill="none" stroke="{col}" stroke-width="8" stroke-linecap="round" transform="rotate({r.uniform(0, 180):.0f} {x0:.0f} {y0:.0f})"/>')
    # egg bits
    for k in range(10):
        x, y = cx + r.uniform(-100, 100), cy + r.uniform(-100, 100)
        b.append(f'<path d="M{x:.0f},{y:.0f} q8,-10 18,-2 q4,10 -8,12 q-12,2 -10,-10 z" fill="#f6d65a"/>')
    # tofu
    for k in range(6):
        x, y = cx + r.uniform(-90, 90), cy + r.uniform(-90, 90)
        b.append(f'<rect x="{x:.0f}" y="{y:.0f}" width="26" height="22" rx="4" fill="#e7b25a" stroke="#c48a33" stroke-width="1.2" transform="rotate({r.uniform(0, 90):.0f} {x:.0f} {y:.0f})"/>')
    # shrimp
    for k, (dx, dy, a) in enumerate([(-60, -50, 20), (40, -70, 110), (70, 30, 200), (-50, 50, 290)]):
        b.append(f'<g transform="translate({cx + dx},{cy + dy}) rotate({a})"><path d="M-34,0 A34,34 0 1 1 30,14" fill="none" stroke="url(#shrimp)" stroke-width="20" stroke-linecap="round"/>'
                 + ''.join(f'<path d="M{-34 * math.cos(math.radians(t)):.1f},{-34 * math.sin(math.radians(t)):.1f} l{-10 * math.cos(math.radians(t)):.1f},{-10 * math.sin(math.radians(t)):.1f}" stroke="#fbd3bd" stroke-width="2" transform="rotate(0)"/>' for t in range(-20, 200, 34))
                 + '<path d="M28,16 l14,12 l-2,-16 z" fill="#d9532c"/></g>')
    # chives + sprouts
    for k in range(26):
        x, y = cx + r.uniform(-120, 120), cy + r.uniform(-120, 120)
        if (x - cx) ** 2 + (y - cy) ** 2 > 150 ** 2:
            continue
        a = r.uniform(0, 180)
        b.append(f'<rect x="{x:.0f}" y="{y:.0f}" width="40" height="5" rx="2" fill="{r.choice(["#3d8b2c", "#5aa93a"])}" transform="rotate({a:.0f} {x:.0f} {y:.0f})"/>')
    # crushed peanuts
    for px, py in scatter_in_circle(r, cx + 10, cy - 10, 110, 90):
        pts = ' '.join(f'{px + r.uniform(-4, 4):.1f},{py + r.uniform(-4, 4):.1f}' for _ in range(4))
        b.append(f'<polygon points="{pts}" fill="{r.choice(["#e9cf9d", "#d7b37a", "#f2e1b9"])}"/>')
    for px, py in scatter_in_circle(r, cx, cy, 130, 30):
        b.append(f'<rect x="{px:.0f}" y="{py:.0f}" width="3" height="3" fill="#b32a17"/>')
    b.append(lime_wedge(cx + 150, cy + 130, -40, 0.9))
    b.append(chopsticks(80, 80, 32, color='#7a4d2b', edge='#3e2514', length=300))
    return svg(d1 + d2, ''.join(b))


# ---------------------------------------------------------------- hanok tea (Gyeongju tea house)
def hanok():
    r = rng(122)
    d1, bg = wood('#6a4529', '#3b2414', grain='#1a0e06', opacity=0.5, seed=12)
    d2 = """
<radialGradient id="celadon" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#d8e6d6"/><stop offset="0.7" stop-color="#a9c2a6"/><stop offset="1" stop-color="#7f9b7c"/></radialGradient>
<radialGradient id="tea" cx="0.45" cy="0.4" r="0.6"><stop offset="0" stop-color="#d8b55a"/><stop offset="1" stop-color="#9e7425"/></radialGradient>
<linearGradient id="tray" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2b1a12"/><stop offset="1" stop-color="#170d08"/></linearGradient>
<radialGradient id="yakgwa" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#d48a3a"/><stop offset="1" stop-color="#8c4a17"/></radialGradient>
"""
    b = [bg]
    # hanji paper mat
    b.append('<g transform="translate(400,300) rotate(-5)"><rect x="-330" y="-210" width="660" height="430" rx="10" fill="#000" opacity="0.4" filter="url(#soft)"/>'
             '<rect x="-340" y="-220" width="660" height="430" rx="10" fill="url(#tray)"/>'
             '<rect x="-325" y="-205" width="630" height="400" rx="6" fill="none" stroke="#8a6440" stroke-width="2" opacity="0.6"/></g>')
    b.append(napkin(120, 120, 260, 190, -8, color='#f3ecdc', stripe='#d9cbb0'))
    # yakgwa plate
    b.append(shadow(250, 230, 112, 106, 0.5))
    b.append('<circle cx="250" cy="230" r="112" fill="#f1eee6"/><circle cx="250" cy="230" r="96" fill="#e6e1d6"/>')
    for k, (dx, dy) in enumerate([(-40, -34), (30, -40), (-46, 30), (34, 30), (0, 0)]):
        x, y = 250 + dx, 230 + dy
        petals = ''.join(f'<circle cx="{x + 20 * math.cos(math.radians(a)):.1f}" cy="{y + 20 * math.sin(math.radians(a)):.1f}" r="15" fill="url(#yakgwa)"/>' for a in range(0, 360, 45))
        b.append(f'<g>{petals}<circle cx="{x}" cy="{y}" r="22" fill="url(#yakgwa)"/><circle cx="{x}" cy="{y}" r="6" fill="#5a2c0c" opacity="0.6"/><circle cx="{x - 6}" cy="{y - 6}" r="5" fill="#fff" opacity="0.18"/></g>')
    # dasik (pastel)
    for k, col in enumerate(['#f2b6c4', '#f6e08c', '#b8d99a', '#f2b6c4', '#d9c7f0', '#f6e08c']):
        x = 520 + (k % 3) * 64
        y = 420 + (k // 3) * 64
        b.append(f'<circle cx="{x + 4}" cy="{y + 8}" r="24" fill="#000" opacity="0.35" filter="url(#soft-sm)"/><circle cx="{x}" cy="{y}" r="24" fill="{col}"/><circle cx="{x}" cy="{y}" r="16" fill="none" stroke="#fff" stroke-width="2" opacity="0.45"/><path d="M{x - 8},{y} l16,0 M{x},{y - 8} l0,16" stroke="#fff" stroke-width="2" opacity="0.4"/>')
    # teapot (top view)
    b.append(shadow(560, 200, 104, 98, 0.55))
    b.append('<circle cx="560" cy="200" r="104" fill="url(#celadon)"/><circle cx="560" cy="200" r="58" fill="#94b291"/><circle cx="560" cy="200" r="50" fill="url(#celadon)"/><circle cx="560" cy="200" r="12" fill="#6f8c6c"/>')
    b.append('<path d="M650,170 Q720,150 742,128 Q752,140 734,166 Q700,196 660,200 Z" fill="url(#celadon)"/>')
    b.append('<path d="M470,230 Q440,260 452,290" stroke="#6f8c6c" stroke-width="10" fill="none" stroke-linecap="round"/>')
    # tea cups
    for (x, y) in [(330, 470), (460, 300)]:
        b.append(shadow(x, y, 62, 58, 0.55))
        b.append(f'<circle cx="{x}" cy="{y}" r="62" fill="url(#celadon)"/><circle cx="{x}" cy="{y}" r="50" fill="url(#tea)"/><ellipse cx="{x - 14}" cy="{y - 16}" rx="16" ry="8" fill="#fff" opacity="0.28"/>')
    # pine needles / leaf garnish
    for k in range(5):
        b.append(leaf(140 + k * 14, 480 + k * 6, -40 + k * 18, 70, 16, '#4f7a3a', '#2c4a1f'))
    return svg(d1 + d2, ''.join(b))


DISHES = {'pho': pho, 'mulhoe': mulhoe, 'padthai': padthai, 'hanok': hanok}
