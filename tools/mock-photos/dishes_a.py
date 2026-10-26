"""Sushi, gukbap, burger."""
import math
from common import (W, H, svg, wood, stone, shadow, rng, scatter_in_circle, chopsticks, spoon, napkin)


# ---------------------------------------------------------------- sushi
FISH = {
    'salmon': ('#f07b3f', '#f9a66c', '#ffe3cc'),
    'tuna': ('#a3192f', '#d23a4a', None),
    'toro': ('#e48c8e', '#f3b3ad', '#fff0ea'),
    'hamachi': ('#efd0bd', '#f8e4d6', '#e8a597'),
    'ebi': ('#fbe7d8', '#fff4ea', '#f2753f'),
    'tamago': ('#f2bf3a', '#f9d665', None),
}


def nigiri(x, y, angle, kind, r, idx):
    base, light, accent = FISH[kind]
    gid = f'f{idx}'
    out = [f'<g transform="translate({x},{y}) rotate({angle})">']
    # shadow
    out.append('<rect x="-30" y="-50" width="76" height="118" rx="30" fill="#000" opacity="0.55" filter="url(#soft-sm)" transform="translate(8,12)"/>')
    # rice: visible as a white rim around the fish
    out.append('<rect x="-34" y="-56" width="68" height="112" rx="30" fill="#f6f1e6"/>')
    for gx, gy in [(r.uniform(-32, 32), r.uniform(-54, 54)) for _ in range(46)]:
        if abs(gx) > 22 or abs(gy) > 44:
            out.append(f'<ellipse cx="{gx:.1f}" cy="{gy:.1f}" rx="5" ry="3" transform="rotate({r.uniform(0,180):.0f} {gx:.1f} {gy:.1f})" fill="#fffdf7" stroke="#e2dccd" stroke-width="0.6"/>')
    # fish slice
    out.append(f'<defs><linearGradient id="{gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{light}"/><stop offset="1" stop-color="{base}"/></linearGradient></defs>')
    out.append(f'<path d="M-30,-60 Q0,-70 30,-60 Q40,0 30,62 Q0,72 -30,62 Q-40,0 -30,-60 Z" fill="url(#{gid})"/>')
    if kind in ('salmon', 'toro'):
        for k in range(5):
            yy = -46 + k * 22
            out.append(f'<path d="M-32,{yy} Q0,{yy + 12} 32,{yy - 4}" fill="none" stroke="{accent}" stroke-width="{3.2 if kind == "salmon" else 2.2}" opacity="0.85"/>')
    if kind == 'hamachi':
        out.append(f'<path d="M-30,-60 Q-40,0 -30,62 L-22,62 Q-30,0 -22,-60 Z" fill="{accent}" opacity="0.7"/>')
    if kind == 'ebi':
        for k in range(6):
            yy = -50 + k * 19
            out.append(f'<path d="M-30,{yy} Q0,{yy + 8} 30,{yy}" fill="none" stroke="{accent}" stroke-width="6" opacity="0.85"/>')
        out.append(f'<path d="M-14,62 L0,82 L14,62 Z" fill="{accent}"/>')
    if kind == 'tuna':
        out.append('<path d="M-20,-40 Q0,-30 18,-44" fill="none" stroke="#e8606c" stroke-width="2" opacity="0.6"/>')
    if kind == 'tamago':
        for k in range(4):
            out.append(f'<line x1="-30" y1="{-40 + k * 26}" x2="30" y2="{-42 + k * 26}" stroke="#d99a22" stroke-width="1.5" opacity="0.6"/>')
        out.append('<rect x="-38" y="-12" width="76" height="24" fill="#1d2b22"/>')
        out.append('<rect x="-38" y="-12" width="76" height="24" fill="#2f4a39" opacity="0.4" filter="url(#grain)"/>')
    # glossy sheen
    out.append('<ellipse cx="-8" cy="-26" rx="10" ry="30" fill="#fff" opacity="0.28" transform="rotate(12)"/>')
    out.append('</g>')
    return ''.join(out)


def sushi():
    r = rng(8)
    d1, bg = wood('#4a3324', '#21150d', grain='#0e0805', opacity=0.5, seed=9)
    d2 = """
<linearGradient id="slate" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#34383d"/><stop offset="1" stop-color="#1c1f22"/></linearGradient>
<filter id="slatetex" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.02 0.25" numOctaves="3" seed="4"/><feColorMatrix type="saturate" values="0"/></filter>
<clipPath id="slateclip"><rect x="-300" y="-150" width="600" height="300" rx="14"/></clipPath>
"""
    body = [bg]
    body.append('<g transform="translate(400,300) rotate(-7)">')
    body.append('<rect x="-290" y="-136" width="600" height="300" rx="14" fill="#000" opacity="0.6" filter="url(#soft)"/>')
    body.append('<rect x="-300" y="-150" width="600" height="300" rx="14" fill="url(#slate)"/>')
    body.append('<g clip-path="url(#slateclip)"><rect x="-300" y="-150" width="600" height="300" filter="url(#slatetex)" opacity="0.16"/></g>')
    body.append('<rect x="-300" y="-150" width="600" height="300" rx="14" fill="none" stroke="#5b6168" stroke-width="2" opacity="0.6"/>')
    kinds = ['salmon', 'tuna', 'hamachi', 'toro', 'ebi', 'tamago']
    for i, kind in enumerate(kinds):
        x = -225 + i * 80
        body.append(nigiri(x, -5 + (8 if i % 2 else -6), -12 + r.uniform(-4, 4), kind, r, i))
    # ginger + wasabi
    for k in range(7):
        a = k * 22 - 40
        body.append(f'<ellipse cx="{238 + 10 * math.cos(math.radians(a)):.1f}" cy="{-62 + 12 * math.sin(math.radians(a)):.1f}" rx="26" ry="15" transform="rotate({a} 238 -62)" fill="#f6c6c2" stroke="#e7a3a2" stroke-width="1" opacity="0.92"/>')
    body.append('<path d="M222,40 q12,-26 34,-14 q20,6 10,26 q-8,18 -30,12 q-22,-4 -14,-24 z" fill="#93bf3e"/>')
    for _ in range(18):
        body.append(f'<circle cx="{r.uniform(224, 262):.1f}" cy="{r.uniform(30, 58):.1f}" r="{r.uniform(1, 2.4):.1f}" fill="#b8dc6a" opacity="0.8"/>')
    body.append('</g>')
    # soy dish
    body.append(shadow(690, 90, 62, 54, 0.6))
    body.append('<circle cx="690" cy="90" r="62" fill="#f4f1ec"/><circle cx="690" cy="90" r="50" fill="#e8e3da"/><circle cx="692" cy="92" r="40" fill="#2a1209"/><ellipse cx="678" cy="78" rx="16" ry="8" fill="#fff" opacity="0.25"/>')
    body.append(chopsticks(120, 520, -8, color='#262321', edge='#0c0b0a', length=520))
    body.append('<g transform="translate(120,520) rotate(-8)"><rect x="0" y="-6" width="60" height="26" fill="#b9934a" opacity="0.9"/></g>')
    return svg(d1 + d2, ''.join(body))


# ---------------------------------------------------------------- gukbap
def pork_slice(x, y, angle, w=104, h=62):
    return (
        f'<g transform="translate({x},{y}) rotate({angle})">'
        f'<rect x="{-w / 2 + 3}" y="{-h / 2 + 5}" width="{w}" height="{h}" rx="20" fill="#7a5a40" opacity="0.35" filter="url(#blur2)"/>'
        f'<rect x="{-w / 2}" y="{-h / 2}" width="{w}" height="{h}" rx="20" fill="url(#pork)" stroke="#a8735b" stroke-width="1.4"/>'
        f'<path d="M{-w / 2 + 8},{-h / 2 + 7} Q0,{-h / 2 - 2} {w / 2 - 8},{-h / 2 + 7}" fill="none" stroke="#fbf1e4" stroke-width="7" stroke-linecap="round" opacity="0.95"/>'
        f'<path d="M{-w / 2 + 14},6 Q0,14 {w / 2 - 14},2" fill="none" stroke="#c99575" stroke-width="2" opacity="0.5"/>'
        f'</g>'
    )


def gukbap():
    r = rng(11)
    d1, bg = wood('#d7b085', '#a97b4f', grain='#5a3818', opacity=0.38, seed=3)
    d2 = """
<radialGradient id="ttuk" cx="0.45" cy="0.4" r="0.6"><stop offset="0.8" stop-color="#2d211b"/><stop offset="1" stop-color="#140e0b"/></radialGradient>
<radialGradient id="broth" cx="0.45" cy="0.42" r="0.6"><stop offset="0" stop-color="#f6eedf"/><stop offset="0.65" stop-color="#ead9bd"/><stop offset="1" stop-color="#c9a77d"/></radialGradient>
<linearGradient id="pork" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ecd2c2"/><stop offset="0.55" stop-color="#d9ad97"/><stop offset="1" stop-color="#c38f78"/></linearGradient>
<radialGradient id="dish" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dcd7cf"/></radialGradient>
"""
    cx, cy = 360, 310
    b = [bg]
    b.append(napkin(560, 330, 220, 300, -14))
    b.append(shadow(cx, cy, 236, 228, 0.55, 16, 24))
    b.append(f'<circle cx="{cx}" cy="{cy}" r="232" fill="url(#ttuk)"/>')
    b.append(f'<circle cx="{cx}" cy="{cy}" r="226" fill="none" stroke="#5c4639" stroke-width="5" opacity="0.8"/>')
    b.append(f'<circle cx="{cx}" cy="{cy}" r="196" fill="url(#broth)"/>')
    b.append(f'<circle cx="{cx}" cy="{cy}" r="196" fill="none" stroke="#a88660" stroke-width="5" opacity="0.5"/>')
    for px, py in scatter_in_circle(r, cx, cy, 180, 70):
        rr = r.uniform(2, 8)
        b.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="{rr:.1f}" fill="#fbf4e6" stroke="#d6bc93" stroke-width="0.9" opacity="0.75"/>')
    for i, (dx, dy, a) in enumerate([(-70, -40, -24), (-36, 10, 8), (-92, 34, 30), (-10, -70, -6), (18, 40, 18), (-58, 82, -14), (40, -20, 34)]):
        b.append(pork_slice(cx + dx, cy + dy, a))
    for px, py in scatter_in_circle(r, cx + 40, cy - 10, 120, 70):
        if r.random() < 0.65:
            b.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="{r.uniform(3.5, 6.5):.1f}" fill="#a8d77e" stroke="#3f8a2a" stroke-width="2.2"/>')
        else:
            b.append(f'<rect x="{px:.1f}" y="{py:.1f}" width="{r.uniform(8, 14):.1f}" height="5" rx="2" fill="#5fae3c" transform="rotate({r.uniform(0, 180):.0f} {px:.1f} {py:.1f})"/>')
    # dadaegi (red pepper paste)
    b.append(f'<path d="M{cx + 60},{cy + 70} q20,-26 46,-10 q26,14 10,38 q-14,22 -40,14 q-28,-10 -16,-42 z" fill="#b52d16"/>')
    b.append(f'<path d="M{cx + 72},{cy + 70} q10,-10 22,-4" fill="none" stroke="#e8674a" stroke-width="4" opacity="0.7"/>')
    for px, py in scatter_in_circle(r, cx + 30, cy, 150, 60):
        b.append(f'<ellipse cx="{px:.1f}" cy="{py:.1f}" rx="2.6" ry="1.5" fill="#f4e4c3" transform="rotate({r.uniform(0, 180):.0f} {px:.1f} {py:.1f})"/>')
    for px, py in scatter_in_circle(r, cx + 70, cy + 70, 60, 26):
        b.append(f'<rect x="{px:.1f}" y="{py:.1f}" width="3" height="2" fill="#c7381c" opacity="0.85"/>')
    # kimchi dish
    b.append(shadow(690, 110, 84, 80, 0.5))
    b.append('<circle cx="690" cy="110" r="84" fill="url(#dish)"/><circle cx="690" cy="110" r="70" fill="#ece7df"/>')
    for k in range(9):
        x = 690 + r.uniform(-40, 40)
        y = 110 + r.uniform(-36, 36)
        b.append(f'<path d="M{x:.0f},{y:.0f} q18,-14 38,0 q-6,16 -38,10 z" fill="#c8361d" transform="rotate({r.uniform(0, 180):.0f} {x:.0f} {y:.0f})"/>')
        b.append(f'<path d="M{x + 6:.0f},{y + 2:.0f} q14,-8 24,0" stroke="#f3dcc0" stroke-width="5" fill="none" opacity="0.85" transform="rotate({r.uniform(0, 180):.0f} {x:.0f} {y:.0f})"/>')
    # chive dish
    b.append(shadow(110, 500, 78, 72, 0.5))
    b.append('<circle cx="110" cy="500" r="78" fill="url(#dish)"/><circle cx="110" cy="500" r="64" fill="#ece7df"/>')
    for k in range(40):
        x = 110 + r.uniform(-44, 44)
        y = 500 + r.uniform(-40, 40)
        a = r.uniform(-60, 60)
        b.append(f'<line x1="{x:.0f}" y1="{y:.0f}" x2="{x + 26 * math.cos(math.radians(a)):.0f}" y2="{y + 26 * math.sin(math.radians(a)):.0f}" stroke="{r.choice(["#3f8a2a", "#5ba93a", "#2f6f1f"])}" stroke-width="3" stroke-linecap="round"/>')
    for k in range(20):
        b.append(f'<rect x="{110 + r.uniform(-40, 40):.0f}" y="{500 + r.uniform(-36, 36):.0f}" width="3" height="3" fill="#c7381c"/>')
    b.append(spoon(640, 330, 96, 0.9))
    b.append(chopsticks(700, 300, 98, length=330))
    return svg(d1 + d2, ''.join(b))


# ---------------------------------------------------------------- burger (3/4 view)
def burger():
    r = rng(22)
    defs = """
<linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a21"/><stop offset="1" stop-color="#1d1410"/></linearGradient>
<linearGradient id="board" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9864f"/><stop offset="1" stop-color="#7d5430"/></linearGradient>
<linearGradient id="bunTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9a548"/><stop offset="0.6" stop-color="#c47724"/><stop offset="1" stop-color="#9c5617"/></linearGradient>
<linearGradient id="bunBot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0d9a9"/><stop offset="0.25" stop-color="#d48d3a"/><stop offset="1" stop-color="#a6611f"/></linearGradient>
<linearGradient id="patty" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b341d"/><stop offset="0.5" stop-color="#3d2112"/><stop offset="1" stop-color="#2a160b"/></linearGradient>
<filter id="crust" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="3" seed="2"/><feColorMatrix type="matrix" values="0 0 0 0 0.15  0 0 0 0 0.07  0 0 0 0 0.02  0 0 0 1.2 -0.35"/></filter>
<clipPath id="pattyclip"><path d="M222,372 Q228,336 400,334 Q572,336 578,372 Q584,408 400,412 Q216,408 222,372 Z"/></clipPath>
<linearGradient id="fry" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e9b042"/><stop offset="0.5" stop-color="#f7d276"/><stop offset="1" stop-color="#d99a2b"/></linearGradient>
"""
    b = [f'<rect width="{W}" height="{H}" fill="url(#wall)"/>']
    # board (perspective ellipse)
    b.append('<ellipse cx="400" cy="520" rx="420" ry="120" fill="#000" opacity="0.5" filter="url(#soft)"/>')
    b.append('<ellipse cx="400" cy="500" rx="400" ry="110" fill="url(#board)"/>')
    b.append('<ellipse cx="400" cy="492" rx="392" ry="100" fill="#c99560" opacity="0.6"/>')
    for k in range(9):
        b.append(f'<path d="M{20 + k * 12},{470 + k * 6} Q400,{440 + k * 9} {780 - k * 12},{470 + k * 6}" fill="none" stroke="#8a5d33" stroke-width="1.4" opacity="0.35"/>')
    # fries cone (right)
    b.append('<ellipse cx="650" cy="470" rx="90" ry="22" fill="#000" opacity="0.45" filter="url(#soft-sm)"/>')
    for k in range(16):
        x = 600 + k * 7 + r.uniform(-3, 3)
        top = 250 + r.uniform(-30, 30)
        a = r.uniform(-14, 14)
        b.append(f'<rect x="{x:.0f}" y="{top:.0f}" width="16" height="190" rx="4" fill="url(#fry)" transform="rotate({a:.0f} {x + 8:.0f} 440)" stroke="#c4861f" stroke-width="0.8"/>')
    b.append('<path d="M585,360 L715,360 L700,470 L600,470 Z" fill="#f2ede4"/>')
    b.append('<path d="M585,360 L715,360 L712,380 L588,380 Z" fill="#d7372b"/>')
    b.append('<path d="M600,410 L705,410 L703,424 L602,424 Z" fill="#d7372b"/>')
    # burger
    b.append('<ellipse cx="400" cy="472" rx="210" ry="34" fill="#000" opacity="0.55" filter="url(#soft-sm)"/>')
    b.append('<path d="M232,420 Q236,474 400,478 Q564,474 568,420 Z" fill="url(#bunBot)"/>')
    b.append('<path d="M226,416 Q400,436 574,416 Q572,402 400,398 Q228,402 226,416 Z" fill="#f2deb0"/>')
    # lettuce
    wave = 'M196,400 ' + ' '.join(f'Q{206 + k * 24},{416 if k % 2 else 388} {218 + k * 24},400' for k in range(17))
    b.append(f'<path d="{wave} L604,412 L196,412 Z" fill="#7cc243"/>')
    b.append(f'<path d="{wave}" fill="none" stroke="#b6e27d" stroke-width="3"/>')
    # patty
    b.append('<path d="M222,372 Q228,336 400,334 Q572,336 578,372 Q584,408 400,412 Q216,408 222,372 Z" fill="url(#patty)"/>')
    b.append('<g clip-path="url(#pattyclip)"><rect x="200" y="320" width="400" height="100" filter="url(#crust)"/></g>')
    # cheese drape
    cheese = 'M214,350 L586,350 L590,362 ' + ' '.join(f'L{580 - k * 34},{362 + (26 if k % 2 == 0 else 6)}' for k in range(11)) + ' L210,362 Z'
    b.append(f'<path d="{cheese}" fill="#f6b928"/>')
    b.append('<path d="M214,350 L586,350 L588,356 L212,356 Z" fill="#fbd35c"/>')
    # tomato
    b.append('<path d="M232,346 Q400,354 568,346 L566,330 Q400,322 234,330 Z" fill="#d43a2a"/>')
    b.append('<path d="M240,336 Q400,330 560,336" fill="none" stroke="#f07b5f" stroke-width="3" opacity="0.7"/>')
    # onion ring
    b.append('<path d="M250,328 Q400,320 552,328" fill="none" stroke="#efe3f0" stroke-width="7"/>')
    b.append('<path d="M250,328 Q400,320 552,328" fill="none" stroke="#b77fb2" stroke-width="1.5" opacity="0.6"/>')
    # top bun
    b.append('<path d="M224,326 Q222,170 400,158 Q578,170 576,326 Q400,342 224,326 Z" fill="url(#bunTop)"/>')
    b.append('<ellipse cx="340" cy="208" rx="80" ry="30" fill="#fff" opacity="0.18" transform="rotate(-12 340 208)"/>')
    for k in range(46):
        a = r.uniform(math.radians(200), math.radians(340))
        rr = r.uniform(0.2, 0.95)
        x = 400 + 160 * rr * math.cos(a)
        y = 300 + 135 * rr * math.sin(a) + 10
        if y < 300:
            b.append(f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="5" ry="2.6" fill="#fbecc6" stroke="#d7b778" stroke-width="0.6" transform="rotate({r.uniform(-50, 50):.0f} {x:.0f} {y:.0f})"/>')
    # skewer pick
    b.append('<line x1="400" y1="40" x2="400" y2="180" stroke="#d9b98a" stroke-width="5"/>')
    b.append('<path d="M400,40 L470,58 L400,76 Z" fill="#e8463a"/>')
    # ketchup dish (left)
    b.append('<ellipse cx="120" cy="470" rx="70" ry="22" fill="#000" opacity="0.4" filter="url(#soft-sm)"/>')
    b.append('<ellipse cx="120" cy="452" rx="66" ry="22" fill="#eeeae4"/><ellipse cx="120" cy="448" rx="52" ry="15" fill="#b8231a"/><ellipse cx="108" cy="444" rx="18" ry="4" fill="#fff" opacity="0.35"/>')
    return svg(defs, ''.join(b))


DISHES = {'sushi': sushi, 'gukbap': gukbap, 'burger': burger}
