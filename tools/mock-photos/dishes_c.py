"""Brunch, bagel, bistro, default placeholder."""
import math
from common import (W, H, svg, wood, stone, marble, shadow, rng, scatter_in_circle, chopsticks, spoon, napkin)
from dishes_b import leaf


def latte(x, y, scale=1.0):
    return (
        f'<g transform="translate({x},{y}) scale({scale})">'
        f'<ellipse cx="14" cy="22" rx="118" ry="112" fill="#000" opacity="0.45" filter="url(#soft)"/>'
        f'<circle cx="0" cy="0" r="116" fill="#f3efe8"/><circle cx="0" cy="0" r="98" fill="#e6e0d6"/>'
        f'<path d="M78,-52 Q132,-62 140,-20 Q146,14 96,22" fill="none" stroke="#f3efe8" stroke-width="20" stroke-linecap="round"/>'
        f'<circle cx="0" cy="0" r="74" fill="#ffffff"/><circle cx="0" cy="0" r="64" fill="#7a4a24"/>'
        f'<circle cx="0" cy="0" r="64" fill="url(#crema)"/>'
        f'<path d="M0,30 C-46,-6 -34,-46 -6,-34 C0,-31 0,-24 0,-20 C0,-24 0,-31 6,-34 C34,-46 46,-6 0,30 Z" fill="#f7ead8"/>'
        f'<path d="M0,18 C-26,-4 -20,-26 -4,-20" fill="none" stroke="#c9945d" stroke-width="2" opacity="0.6"/>'
        f'</g>'
    )


CREMA = '<radialGradient id="crema" cx="0.5" cy="0.5" r="0.5"><stop offset="0.6" stop-color="#b9783c" stop-opacity="0"/><stop offset="1" stop-color="#5a3216" stop-opacity="0.8"/></radialGradient>'


# ---------------------------------------------------------------- brunch (avocado toast + egg + latte)
def brunch():
    r = rng(66)
    d1, bg = marble(seed=17)
    d2 = CREMA + """
<radialGradient id="plateW" cx="0.42" cy="0.38" r="0.65"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dcd9d2"/></radialGradient>
<linearGradient id="toast" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2a85a"/><stop offset="1" stop-color="#b9782f"/></linearGradient>
<radialGradient id="avo" cx="0.45" cy="0.4" r="0.6"><stop offset="0" stop-color="#b9d66a"/><stop offset="1" stop-color="#7fa63a"/></radialGradient>
<radialGradient id="yolk" cx="0.4" cy="0.35" r="0.6"><stop offset="0" stop-color="#ffd25a"/><stop offset="1" stop-color="#f29a12"/></radialGradient>
<filter id="avotex" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.12" numOctaves="2" seed="6"/><feColorMatrix type="matrix" values="0 0 0 0 0.25  0 0 0 0 0.4  0 0 0 0 0.1  0 0 0 1.4 -0.5"/></filter>
<clipPath id="avoclip"><path d="M286,190 Q300,170 340,174 L470,180 Q500,184 500,214 L496,380 Q492,410 462,408 L300,400 Q272,396 274,366 Z"/></clipPath>
"""
    b = [bg]
    b.append(napkin(520, 380, 300, 200, 10, color='#e9e4f2', stripe='#c9bfe0'))
    b.append(shadow(380, 300, 236, 228, 0.42, 14, 22))
    b.append('<circle cx="380" cy="300" r="234" fill="url(#plateW)"/><circle cx="380" cy="300" r="190" fill="none" stroke="#d6d2ca" stroke-width="2"/>')
    # toast
    b.append('<path d="M276,180 Q290,152 340,158 L478,166 Q514,170 512,206 L508,388 Q504,424 466,422 L296,414 Q262,410 264,374 Z" fill="url(#toast)"/>')
    b.append('<path d="M286,190 Q300,170 340,174 L470,180 Q500,184 500,214 L496,380 Q492,410 462,408 L300,400 Q272,396 274,366 Z" fill="#f2d7a2"/>')
    b.append('<path d="M290,200 Q330,186 480,196 L478,380 Q380,392 292,384 Z" fill="url(#avo)"/>')
    b.append('<g clip-path="url(#avoclip)"><rect x="280" y="170" width="230" height="240" filter="url(#avotex)"/></g>')
    # egg
    b.append('<path d="M330,250 Q350,200 410,214 Q470,206 476,262 Q490,318 430,330 Q370,348 338,312 Q312,284 330,250 Z" fill="#fffdf8" stroke="#ece6da" stroke-width="2"/>')
    b.append('<circle cx="404" cy="270" r="34" fill="url(#yolk)"/><ellipse cx="394" cy="258" rx="12" ry="7" fill="#fff" opacity="0.5"/>')
    # chili flakes + pepper + microgreens
    for px, py in scatter_in_circle(r, 400, 290, 110, 50):
        b.append(f'<rect x="{px:.0f}" y="{py:.0f}" width="3" height="3" fill="{r.choice(["#c0331e", "#2a2a2a"])}" opacity="0.8"/>')
    for k in range(8):
        b.append(leaf(300 + r.uniform(0, 180), 340 + r.uniform(0, 40), r.uniform(0, 360), 26, 10, r.choice(['#5aa93a', '#7cc243'])))
    # cherry tomatoes
    for (x, y) in [(230, 330), (250, 380), (560, 250)]:
        b.append(f'<circle cx="{x + 3}" cy="{y + 6}" r="22" fill="#000" opacity="0.3" filter="url(#soft-sm)"/><circle cx="{x}" cy="{y}" r="22" fill="#d9322a"/><circle cx="{x}" cy="{y}" r="15" fill="#f2735f"/><circle cx="{x}" cy="{y}" r="4" fill="#f7d2a0"/>')
    b.append(latte(650, 140, 0.9))
    return svg(d1 + d2, ''.join(b))


# ---------------------------------------------------------------- bagel
def bagel_shape(x, y, rot, seeds, r, cut=False, idx=0):
    gid = f'bagel{idx}'
    out = [f'<g transform="translate({x},{y}) rotate({rot})">']
    out.append(f'<defs><radialGradient id="{gid}" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#e9b766"/><stop offset="0.6" stop-color="#c6832f"/><stop offset="1" stop-color="#8f5418"/></radialGradient></defs>')
    out.append('<ellipse cx="12" cy="18" rx="112" ry="106" fill="#000" opacity="0.45" filter="url(#soft)"/>')
    if cut:
        out.append(f'<circle cx="0" cy="0" r="108" fill="url(#{gid})"/>')
        out.append('<circle cx="0" cy="0" r="96" fill="#f3e3c4"/>')
        out.append('<path d="M-88,10 Q-80,-70 0,-86 Q80,-80 90,-6 Q86,70 6,88 Q-76,84 -88,10 Z" fill="#fbf8f1"/>')
        out.append('<path d="M-60,-30 Q-30,-60 20,-58" stroke="#fff" stroke-width="6" fill="none" opacity="0.9"/>')
        for k in range(14):
            px, py = r.uniform(-60, 60), r.uniform(-60, 60)
            out.append(f'<circle cx="{px:.0f}" cy="{py:.0f}" r="{r.uniform(2, 4):.1f}" fill="#7fae4a" opacity="0.7"/>')
        out.append('<circle cx="0" cy="0" r="22" fill="#e6d2ad"/><circle cx="0" cy="0" r="14" fill="#c9ad7d" opacity="0.6"/>')
    else:
        out.append(f'<circle cx="0" cy="0" r="108" fill="url(#{gid})"/>')
        out.append('<circle cx="0" cy="0" r="30" fill="#7d5a37" opacity="0.65"/>')
        out.append('<circle cx="0" cy="0" r="22" fill="#f1e6d0"/>')
        out.append('<ellipse cx="-34" cy="-46" rx="40" ry="16" fill="#fff" opacity="0.22" transform="rotate(-30 -34 -46)"/>')
        for k in range(seeds):
            a = r.uniform(0, math.tau)
            d = r.uniform(38, 98)
            px, py = d * math.cos(a), d * math.sin(a)
            col = r.choice(['#fbf2da', '#2a2421', '#f5e6c2', '#fbf2da'])
            out.append(f'<ellipse cx="{px:.1f}" cy="{py:.1f}" rx="4" ry="2.2" fill="{col}" transform="rotate({r.uniform(0, 180):.0f} {px:.1f} {py:.1f})"/>')
    out.append('</g>')
    return ''.join(out)


def bagel():
    r = rng(77)
    d1, bg = wood('#e1c39b', '#bf9a6c', grain='#6b4a24', opacity=0.33, seed=41)
    d2 = CREMA + """
<pattern id="parchment" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#f4ecdc"/><path d="M0,12 L12,0" stroke="#e6dac3" stroke-width="1"/></pattern>
"""
    b = [bg]
    b.append('<g transform="translate(360,300) rotate(-8)"><rect x="-290" y="-220" width="560" height="430" fill="#000" opacity="0.25" filter="url(#soft)"/>'
             '<path d="M-300,-230 L270,-220 L262,206 L-292,214 Z" fill="url(#parchment)"/>'
             '<path d="M-300,-230 L270,-220" stroke="#d9cbb0" stroke-width="2"/></g>')
    b.append(bagel_shape(230, 210, 10, 110, r, idx=0))
    b.append(bagel_shape(470, 190, -20, 0, r, idx=1))
    b.append(bagel_shape(330, 430, 40, 130, r, idx=2))
    b.append(bagel_shape(560, 420, 0, 0, r, cut=True, idx=3))
    # butter knife
    b.append('<g transform="translate(120,480) rotate(-30)"><rect x="6" y="10" width="230" height="22" rx="10" fill="#000" opacity="0.25" filter="url(#soft-sm)"/>'
             '<rect x="0" y="0" width="120" height="20" rx="9" fill="#5a3a22"/><path d="M118,2 L236,4 Q248,10 236,18 L118,18 Z" fill="#d6dbe0" stroke="#9aa3ad"/></g>')
    b.append(latte(700, 110, 0.75))
    return svg(d1 + d2, ''.join(b))


# ---------------------------------------------------------------- bistro (steak frites + wine)
def bistro():
    r = rng(111)
    d1 = """
<pattern id="check" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="#f3efe7"/><rect width="30" height="30" fill="#c9443d" opacity="0.85"/><rect x="30" y="30" width="30" height="30" fill="#c9443d" opacity="0.85"/><rect width="60" height="30" fill="#c9443d" opacity="0.25"/><rect width="30" height="60" fill="#c9443d" opacity="0.25"/></pattern>
<radialGradient id="plateB" cx="0.42" cy="0.38" r="0.65"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d8d4cb"/></radialGradient>
<linearGradient id="steak" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a3d21"/><stop offset="1" stop-color="#4a210f"/></linearGradient>
<linearGradient id="fryB" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e5a93c"/><stop offset="0.5" stop-color="#f6d27a"/><stop offset="1" stop-color="#d7962a"/></linearGradient>
<radialGradient id="wine" cx="0.45" cy="0.4" r="0.6"><stop offset="0" stop-color="#7a1426"/><stop offset="1" stop-color="#3d0712"/></radialGradient>
<filter id="sear" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="3" seed="12"/><feColorMatrix type="matrix" values="0 0 0 0 0.1  0 0 0 0 0.04  0 0 0 0 0.01  0 0 0 1.3 -0.45"/></filter>
<clipPath id="steakclip"><path d="M250,210 Q300,160 380,176 Q470,190 480,250 Q490,320 420,350 Q330,380 270,330 Q220,280 250,210 Z"/></clipPath>
"""
    d0, bg = wood('#8e623d', '#5a3a20', grain='#24140a', opacity=0.42, seed=55)
    b = [bg]
    b.append('<g transform="translate(400,300) rotate(-12)"><rect x="-300" y="-230" width="600" height="460" fill="#000" opacity="0.3" filter="url(#soft)"/><rect x="-310" y="-240" width="600" height="460" fill="url(#check)"/></g>')
    b.append(shadow(370, 300, 230, 222, 0.5, 14, 22))
    b.append('<circle cx="370" cy="300" r="228" fill="url(#plateB)"/><circle cx="370" cy="300" r="186" fill="none" stroke="#d3cec4" stroke-width="2"/>')
    # fries pile
    for k in range(26):
        x = 420 + r.uniform(0, 110)
        y = 300 + r.uniform(-40, 120)
        a = r.uniform(-70, 70)
        b.append(f'<rect x="{x:.0f}" y="{y:.0f}" width="{r.uniform(70, 100):.0f}" height="14" rx="4" fill="url(#fryB)" stroke="#c4861f" stroke-width="0.8" transform="rotate({a:.0f} {x:.0f} {y:.0f})"/>')
    # steak
    b.append('<path d="M256,220 Q306,170 386,186 Q476,200 486,260 Q496,330 426,360 Q336,390 276,340 Q226,290 256,220 Z" fill="#000" opacity="0.35" filter="url(#soft-sm)"/>')
    b.append('<path d="M250,210 Q300,160 380,176 Q470,190 480,250 Q490,320 420,350 Q330,380 270,330 Q220,280 250,210 Z" fill="url(#steak)"/>')
    b.append('<g clip-path="url(#steakclip)"><rect x="220" y="150" width="280" height="240" filter="url(#sear)"/>'
             + ''.join(f'<line x1="{230 + k * 46}" y1="150" x2="{170 + k * 46}" y2="400" stroke="#1c0b04" stroke-width="9" opacity="0.65"/>' for k in range(7))
             + '</g>')
    b.append('<path d="M262,214 Q300,176 376,188" stroke="#f3dcc6" stroke-width="5" fill="none" opacity="0.6"/>')
    # herb butter
    b.append('<ellipse cx="360" cy="262" rx="36" ry="26" fill="#f6e3a0"/><ellipse cx="354" cy="256" rx="16" ry="8" fill="#fff" opacity="0.5"/>')
    for k in range(12):
        b.append(f'<circle cx="{360 + r.uniform(-26, 26):.0f}" cy="{262 + r.uniform(-18, 18):.0f}" r="2" fill="#4f8a2a"/>')
    # salad
    for k in range(9):
        b.append(leaf(250 + r.uniform(0, 80), 380 + r.uniform(0, 50), r.uniform(0, 360), 56, 22, r.choice(['#5aa93a', '#7cc243', '#3f8f2f'])))
    # wine glass (top view)
    b.append('<circle cx="680" cy="140" r="86" fill="#000" opacity="0.35" filter="url(#soft)"/>')
    b.append('<circle cx="670" cy="126" r="84" fill="#ffffff" opacity="0.25" stroke="#ffffff" stroke-opacity="0.7" stroke-width="2"/><circle cx="670" cy="126" r="62" fill="url(#wine)"/><ellipse cx="648" cy="104" rx="24" ry="10" fill="#fff" opacity="0.35"/>')
    # fork + knife
    b.append('<g transform="translate(110,560) rotate(-72)"><rect x="0" y="0" width="300" height="14" rx="6" fill="#cfd5db" stroke="#8d969f"/><rect x="0" y="-6" width="90" height="26" rx="10" fill="#2a2420"/></g>')
    b.append('<g transform="translate(70,540) rotate(-80)"><rect x="0" y="0" width="300" height="10" rx="5" fill="#cfd5db" stroke="#8d969f"/>'
             + ''.join(f'<rect x="300" y="{-10 + k * 9}" width="44" height="4" rx="2" fill="#cfd5db" stroke="#8d969f" stroke-width="0.6"/>' for k in range(4))
             + '</g>')
    return svg(d0 + d1, ''.join(b))


# ---------------------------------------------------------------- default placeholder (empty plate, cutlery)
def default():
    d1, bg = stone('#d9d2c7', '#bfb6a8', opacity=0.12, seed=3)
    d2 = '<radialGradient id="plateD" cx="0.42" cy="0.38" r="0.65"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dcd7ce"/></radialGradient>'
    b = [bg, shadow(400, 300, 210, 204, 0.4, 14, 20),
         '<circle cx="400" cy="300" r="208" fill="url(#plateD)"/><circle cx="400" cy="300" r="160" fill="none" stroke="#d2ccc1" stroke-width="2"/>',
         '<g transform="translate(150,90) rotate(90)"><rect x="0" y="0" width="420" height="14" rx="7" fill="#cfd5db" stroke="#8d969f"/></g>',
         '<g transform="translate(660,90) rotate(90)"><rect x="0" y="0" width="420" height="14" rx="7" fill="#cfd5db" stroke="#8d969f"/></g>']
    return svg(d1 + d2, ''.join(b))


DISHES = {'brunch': brunch, 'bagel': bagel, 'bistro': bistro, 'default': default}
