#!/usr/bin/env python3
"""Generates every page of the MeltiQue Chocoland website.
Edit the PRODUCT DATA below, then run:  python3 _build/build.py
(WhatsApp number lives in js/config.js and is applied in the browser.)"""
import html, os, re, random
from urllib.parse import quote

_HERE = os.path.dirname(os.path.abspath(__file__))
_PARENT = os.path.abspath(os.path.join(_HERE, '..'))
OUT = _PARENT if os.path.isdir(os.path.join(_PARENT, 'css')) else os.path.join(_PARENT, 'out')
BRAND = 'MeltiQue Chocoland'
TAG = 'BEYOND CHOCOLATE…'
# WhatsApp number: digits only with country code, e.g. 919876543210. Set it here, then run this script.
WA_NUMBER = os.environ.get('MQ_WA', '919342647736')
WAN = re.sub(r'\D', '', WA_NUMBER)
EMAIL = 'MeltiQu.choco@gmail.com'
IG_URL = 'https://www.instagram.com/meltiqu.choco'
IG_HANDLE = '@meltiqu.choco'
ADDRESS = 'Parappalayam, Mangalam Road, Tirupur, Tamil Nadu 641604'
# --- Chocolate guide (anime character) settings ---
GUIDE_NAME = 'Koko'          # the guide's name; change it here and rebuild
# Prices the guide will tell visitors. Leave a product out until the price is confirmed.
# Example:  PRICES = {'Chocolate Bars': 'Rs. 150', 'Coffee Chocolate': 'Rs. 180'}
PRICES = {}
# Chocolate types (dark / milk / white) CONFIRMED per product by the owner. Leave a product out
# until confirmed: the guide never assumes a product comes in every type.
# Example:  TYPES = {'Chocolate Bars': ['dark', 'milk', 'white'], 'Coffee Chocolate': ['dark']}
TYPES = {}
# Real product photos you own, relative to the site root. Example: {'Chocolate Bars': 'img/bars.jpg'}
# Products without a photo show a labelled placeholder, never a stock or invented image.
IMAGES = {}
# Enquiry endpoint: the URL of your deployed serverless function (see worker/README.md).
# Leave empty and the guide will NOT collect personal details; it offers WhatsApp/email instead.
ENQUIRY_URL = os.environ.get('MQ_ENQUIRY_URL', '')
E = lambda s: html.escape(str(s), quote=True)

# ------------------------------------------------------------------ PRODUCT DATA
# status: now | pre | concept | soon     action: order | preorder | explore | launch
ITEMS = [
 # Available Now
 dict(cat='available', name='Chocolate Bars', status='now', action='order', desc='Classic chocolate bars, made for everyday cravings.'),
 dict(cat='available', name='Coffee Chocolate', status='now', action='order', desc='Chocolate with a coffee character, for slow, thoughtful bites.'),
 dict(cat='available', name='Honey Chocolate', status='now', action='order', desc='Smooth chocolate paired with the gentle sweetness of honey.'),
 dict(cat='available', name='Nut Chocolate', status='now', action='order', desc='Chocolate with a satisfying nutty bite.'),
 dict(cat='available', name='Cookies with Chocolate Fillings', status='now', action='order', desc='Cookies with a chocolate centre, ordered through WhatsApp.'),
 dict(cat='available', name='Chocolate Bombs', status='now', action='order', desc='A showpiece chocolate treat, available through WhatsApp.'),
 dict(cat='available', name='Chocolate-covered Fruits and Nuts', status='now', action='order', desc='Fruits and nuts wrapped in chocolate.', note='Please confirm availability on WhatsApp before ordering.'),
 # Pre-order
 dict(cat='pre', name='Brownie Bites', status='pre', action='preorder', desc='Bite-sized chocolate brownies, reserved in advance.'),
 dict(cat='pre', name='Cocoa Truffles', status='pre', action='preorder', desc='Soft, cocoa-rich truffles made to share or savour alone.'),
 dict(cat='pre', name='Chocolate Dips', status='pre', action='preorder', desc='Chocolate dips for fruit, snacks and gatherings.'),
 dict(cat='pre', name='Donut-shaped Chocolates', status='pre', action='preorder', desc='Playful donut-shaped chocolates, made on request.'),
 dict(cat='pre', name='Personalized Chocolates', status='pre', action='preorder', desc='Chocolates shaped around a name, a message or an occasion.', note='Customization details are confirmed on WhatsApp.'),
 dict(cat='pre', name='Chocolate Fudge', status='pre', action='preorder', desc='Dense, indulgent chocolate fudge.', note='Subject to production confirmation.'),
 # Create, Gift & Celebrate
 dict(cat='gift', name='Create Your Own Chocolate Box', status='pre', action='preorder', desc='Tell us your preferred combinations and we will talk through what can go in your box.', note='Combinations are confirmed before your order is accepted.'),
 dict(cat='gift', name='Secret Message Chocolate', status='concept', label='Concept in Development · Pre-order Enquiries Available', action='preorder', desc='A chocolate gift that carries a personalized message.', note='Final design and availability must be confirmed.'),
 dict(cat='gift', name='Chocolate & Lifestyle Gift Bundles', status='concept', label='Concept in Development · Pre-order Enquiries Available', action='preorder', desc='A proposed combination of chocolate and suitable gift items.', note='Gift contents are not fixed. Nothing is promised until confirmed.'),
 dict(cat='gift', name='Limited-Edition Celebration Boxes', status='pre', action='preorder', desc='Seasonal and occasion boxes.', themes=['Halloween','Diwali','Christmas','Pongal','Birthdays','Anniversaries','Other festivals, parties, functions and celebrations'], note='Availability depends on the collection schedule and production capacity.'),
 dict(cat='gift', name='Say It with Chocolate', status='pre', action='preorder', desc='Personalized chocolate gifting for messages, celebrations and special occasions.', note='Exact customization is confirmed on WhatsApp.'),
 # The MeltiQue Lab (all Coming Soon)
 dict(cat='lab', name='Puzzle Chocolates / Puzzle Packaging', status='soon', action='explore', desc='A chocolate gift or packaging idea with a puzzle and discovery element.', note='The final design is not set.'),
 dict(cat='lab', name='More Chocolate Collections', status='soon', action='launch', desc='A preview of future flavours, shapes and limited editions.', note='Nothing here is available yet.'),
 dict(cat='lab', name='Surprise Discovery Box', status='soon', action='explore', desc='A possible gift box built around surprise and discovery.', note='Contents are not decided.'),
 dict(cat='lab', name='Chocolate Marshmallows', status='soon', action='launch', desc='Marshmallows with a chocolate twist, in development.'),
 dict(cat='lab', name='Dessert Cups', status='soon', action='launch', desc='Chocolate dessert cups, in development.'),
 dict(cat='lab', name='Chocolate-covered Popcorn', status='soon', action='launch', desc='Popcorn dipped in chocolate.', note='Coming Soon unless the business confirms it is available.'),
 dict(cat='lab', name='Protein Chocolates', status='soon', action='launch', desc='An idea still in development.', note='No health or nutritional claims are made.'),
 dict(cat='lab', name='Piku Chocolate', status='soon', action='explore', desc='A future playful collection under MeltiQue Chocoland, inspired by dogs.', href='piku.html'),
]
CATS = {
 'available': ('Available Now', 'index.html#available'),
 'pre': ('Pre-order Collection', 'index.html#preorders'),
 'gift': ('Create, Gift & Celebrate', 'index.html#gifts'),
 'lab': ('The MeltiQue Lab', 'lab.html'),
}
STATUS = {'now': 'Available Now', 'pre': 'Pre-order Available', 'concept': 'Concept in Development', 'soon': 'Coming Soon'}
BTN = {'order': 'Order on WhatsApp', 'preorder': 'Pre-order Enquiry', 'explore': 'Explore Idea', 'launch': 'Join Launch List'}
THEME = {'available': 't-choc', 'pre': 't-cream', 'gift': 't-burg', 'lab': 't-char'}

def slug(n): return re.sub(r'[^a-z0-9]+', '-', n.lower()).strip('-')
for it in ITEMS:
    it['slug'] = slug(it['name'])
    it.setdefault('href', 'explore/%s.html' % it['slug'])

def wa_msg(it):
    a = it['action']; n = it['name']
    if a == 'order': return f'Hi {BRAND}! I would like to order: {n}.'
    if a == 'preorder': return f'Hi {BRAND}! Pre-order enquiry: {n}. Please confirm availability, price, customization requirements and the estimated fulfilment date.'
    if a == 'launch': return f'Hi {BRAND}! Please add me to the launch list for: {n}.'
    return f'Hi {BRAND}! I would like to know more about this idea: {n}.'

def wa(text, cls='btn btn-gold btn-sm', label=None, icon=False, extra=''):
    ic = '<svg aria-hidden="true"><use href="#wa"/></svg>' if icon else ''
    return (f'<a class="{cls}" data-wa="{E(text)}" href="https://wa.me/{WAN}?text={quote(text)}" target="_blank" rel="noopener"{extra}>{ic}{E(label)}</a>')

# ------------------------------------------------------------------ SHARED PARTS
DEFS = '''<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
<symbol id="wa" viewBox="0 0 24 24"><path fill="currentColor" d="M12.04 2a9.9 9.9 0 0 0-8.4 15.1L2 22l5-1.6A9.9 9.9 0 1 0 12.04 2Zm0 1.8a8.1 8.1 0 0 1 0 16.2c-1.4 0-2.7-.4-3.8-1l-.3-.2-2.9.9.9-2.8-.2-.3A8.1 8.1 0 0 1 12 3.8Zm-3 3.6c-.2 0-.5.1-.7.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3 2.4 1 2.9.8 3.4.7.5 0 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.4l-1.9-.9c-.3-.1-.5-.1-.7.1l-.9 1.1c-.2.2-.3.2-.6.1-.3-.2-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.4.1-.6l.4-.5.3-.4c.1-.2 0-.4 0-.5l-.9-2.1c-.2-.5-.4-.5-.6-.5Z"/></symbol>
<symbol id="paw" viewBox="0 0 64 64"><g fill="currentColor"><ellipse cx="14" cy="28" rx="7" ry="9" transform="rotate(-18 14 28)"/><ellipse cx="26" cy="15" rx="7" ry="10" transform="rotate(-6 26 15)"/><ellipse cx="40" cy="15" rx="7" ry="10" transform="rotate(6 40 15)"/><ellipse cx="52" cy="28" rx="7" ry="9" transform="rotate(18 52 28)"/><path d="M32 30c-9 0-18 9-18 17 0 6 5 9 10 9 3 0 5-1 8-1s5 1 8 1c5 0 10-3 10-9 0-8-9-17-18-17Z"/></g></symbol>
<symbol id="drip" viewBox="0 0 1200 64" preserveAspectRatio="none"><path fill="currentColor" d="M0 0h1200v12c-30 0-34 14-34 24s-10 20-18 20-18-8-18-22-6-22-26-22-24 10-24 26-8 26-18 26-18-8-18-26-4-26-22-26c-26 0-28 14-28 30s-10 24-20 24-18-8-18-24-8-30-30-30-30 14-30 28-8 22-18 22-18-8-18-24-6-26-24-26H640c-24 0-26 14-26 26s-8 22-18 22-18-8-18-24-6-24-24-24-26 12-26 26-8 24-18 24-18-8-18-24-6-26-26-26-28 12-28 30-8 24-18 24-18-10-18-26-6-28-24-28H210c-22 0-26 12-26 26s-6 20-16 20-18-8-18-22-6-24-26-24-26 10-26 24-6 22-16 22-18-8-18-24-6-24-24-24H0Z"/></symbol>
<symbol id="rib" viewBox="0 0 2880 200" preserveAspectRatio="none"><path d="M0 120c140-70 260-70 360 0s220 70 360 0 c140-70 260-70 360 0s220 70 360 0 c140-70 260-70 360 0s220 70 360 0 c140-70 260-70 360 0s220 70 360 0 V200H0Z"/></symbol>
</defs></svg>'''

RING = [
 ('Available Now', 'index.html#available'), ('Pre-orders', 'index.html#preorders'),
 ('Gifts & Celebrations', 'index.html#gifts'), ('Bulk Orders', 'bulk.html'),
 ('The MeltiQue Lab', 'lab.html'), ('Piku Chocolate', 'piku.html'),
 ('Treasure Club', 'treasure-club.html'), ('About', 'about.html'), ('Find Us', 'find-us.html'),
]
NAV = [('Products', 'index.html#available'), ('Pre-orders', 'index.html#preorders'), ('Upcoming Collections', 'lab.html'),
       ('Treasure Club', 'treasure-club.html'), ('About', 'about.html'), ('Find Us', 'find-us.html')]

def header(root, cur=''):
    cur_attr = ' aria-current="page"'
    links = ''.join('<li><a href="%s%s"%s>%s</a></li>' % (root, h, cur_attr if h == cur else '', E(n)) for n, h in NAV)
    ring = ''.join(f'<li style="--i:{i}"><a href="{root}{h}">{E(n)}</a></li>' for i, (n, h) in enumerate(RING))
    return f'''<a class="skip" href="#main">Skip to content</a>
<header class="nav" id="nav"><div class="wrap nav-in">
<a class="logo" href="{root}index.html" aria-label="{BRAND} home"><span class="wordmark" data-logo>MeltiQue <b>Chocoland</b></span></a>
<nav aria-label="Main"><ul class="links">{links}</ul></nav>
<div class="nav-r"><button class="ring-btn" id="ringBtn" aria-haspopup="dialog" aria-expanded="false" aria-controls="ring"><i aria-hidden="true"></i><span>Chocoland Menu</span><span class="sr">Menu</span></button>
<a class="btn btn-gold btn-sm nav-wa" data-wa="Hi {BRAND}!" href="https://wa.me/{WAN}?text={quote('Hi '+BRAND+'!')}" target="_blank" rel="noopener">WhatsApp</a></div>
</div></header>
<div class="ring-ov" id="ring" role="dialog" aria-modal="true" aria-label="Explore {BRAND}" hidden>
<button class="ring-close" id="ringClose" type="button">Close</button>
<div class="ring-stage" id="ringStage"><div class="ring-disc" aria-hidden="true"></div>
<div class="ring-center"><span class="wordmark">MeltiQue <b>Chocoland</b></span><p>{TAG}</p><small>Drag the ring to turn it, or use the links.</small></div>
<ul class="ring-list" id="ringList" style="--n:{len(RING)}">{ring}</ul></div></div>'''

def footer(root):
    return f'''<footer><div class="wrap"><div class="foot">
<div><span class="wordmark">MeltiQue <b>Chocoland</b></span><p class="tl2">{TAG}</p></div>
<div><p class="label">Explore</p><ul><li><a href="{root}index.html#available">Available Now</a></li><li><a href="{root}index.html#preorders">Pre-orders</a></li><li><a href="{root}index.html#gifts">Create, Gift &amp; Celebrate</a></li><li><a href="{root}bulk.html">Bulk Orders</a></li><li><a href="{root}lab.html">The MeltiQue Lab</a></li><li><a href="{root}piku.html">Piku Chocolate</a></li><li><a href="{root}treasure-club.html">Treasure Club</a></li></ul></div>
<div><p class="label">Company</p><ul><li><a href="{root}about.html">About</a></li><li><a href="{root}find-us.html">Find Us</a></li><li><a href="{root}privacy.html">Privacy Policy</a></li><li><a href="{root}terms.html">Terms &amp; Conditions</a></li></ul></div>
<div><p class="label">Contact</p><ul><li><a data-wa="Hi {BRAND}!" href="https://wa.me/{WAN}?text={quote('Hi '+BRAND+'!')}" target="_blank" rel="noopener">WhatsApp</a></li><li><a href="mailto:{EMAIL}">{EMAIL}</a></li><li><a href="{IG_URL}" target="_blank" rel="noopener">Instagram {IG_HANDLE}</a></li><li>{ADDRESS}</li></ul></div>
</div><p class="copy-r">© <span id="yr">2026</span> {BRAND}. All rights reserved.</p></div></footer>
<div class="mbar">{wa('Hi '+BRAND+'! I would like to place an order.', 'btn btn-gold', 'Order on WhatsApp', True)}</div>'''

def head(title, desc, root, extra_head=''):
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{E(title)}</title>
<meta name="description" content="{E(desc)}">
<meta name="theme-color" content="#281611">
<meta property="og:type" content="website"><meta property="og:site_name" content="{BRAND}">
<meta property="og:title" content="{E(title)}"><meta property="og:description" content="{E(desc)}">
<meta name="twitter:card" content="summary"><meta name="twitter:title" content="{E(title)}"><meta name="twitter:description" content="{E(desc)}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..700;1,6..96,400..700&family=Instrument+Sans:wght@400;500;600&display=swap">
<link rel="stylesheet" href="{root}css/styles.css">
<script>document.documentElement.classList.add('js');try{{var p=sessionStorage.getItem('mqPortal');if(p){{sessionStorage.removeItem('mqPortal');var q=JSON.parse(p);var s=document.documentElement.style;s.setProperty('--px',q.x+'px');s.setProperty('--py',q.y+'px');document.documentElement.classList.add('p-arrive');}}}}catch(e){{}}</script>
{extra_head}
</head>
<body>
{DEFS}
'''

def tail(root, hero_js=False):
    s = f'<script src="{root}js/config.js"></script>\n<script src="{root}js/guide-data.js"></script>\n<script src="{root}js/site.js" defer></script>\n<script src="{root}js/guide.js" defer></script>\n'
    if hero_js: s += f'<script src="{root}js/hero.js" defer></script>\n'
    return s + '</body>\n</html>\n'

def write(path, content):
    p = os.path.join(OUT, path)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w', encoding='utf-8').write(content)

# ------------------------------------------------------------------ 3D DECOR
def fl(kind, left=None, top=None, right=None, bottom=None, s=60, depth=.3, cls='', **k):
    pos = ''.join(f'{n}:{v};' for n, v in (('left', left), ('top', top), ('right', right), ('bottom', bottom)) if v is not None)
    bt = k.get('bt', 10); bd = k.get('bd', 0); t = k.get('t', 34)
    if 'n' in k: pos += '--n:%s;' % k['n']
    inner = {
     'cube': f'<span class="obj cube {k.get("v","")}" style="--s:{s}px;--t:{t}s;--bt:{bt}s;--bd:-{bd}s"><i></i><i></i><i></i><i></i><i></i><i></i></span>',
     'sph': f'<span class="obj sph {k.get("v","")}" style="--s:{s}px;--bt:{bt}s;--bd:-{bd}s"></span>',
     'slab': f'<span class="obj" style="--bt:{bt}s;--bd:-{bd}s"><span class="slab" style="--s:{s}px"></span></span>',
     'paw': f'<span class="obj paw" style="--s:{s}px;--r:{k.get("r",0)}deg;--o:{k.get("o",.22)};--bt:{bt}s;--bd:-{bd}s"><svg aria-hidden="true"><use href="#paw"/></svg></span>',
    }[kind]
    return f'<span class="fl {cls}" data-depth="{depth}" style="{pos}">{inner}</span>'

def scene(name, css_only=False, light=False):
    presets = {
     'hero': [fl('cube', right='8%', top='20%', s=92, depth=.5, v='gold', cls='css-o', t=40), fl('slab', right='24%', top='52%', s=118, depth=.25, cls='css-o', bt=12),
              fl('sph', right='6%', top='60%', s=70, depth=.7, v='car', cls='css-o hide-m', bt=9, bd=2), fl('cube', right='36%', top='14%', s=56, depth=.35, cls='css-o hide-m', t=30),
              fl('sph', right='30%', top='72%', s=44, depth=.6, cls='css-o', bt=11, bd=4), fl('paw', left='4%', top='64%', s=70, r=-18, o=.2, depth=.2, bt=13), fl('paw', right='42%', top='38%', s=56, r=14, o=.16, depth=.4, cls='hide-m', bt=15, bd=3),
              fl('paw', right='3%', top='10%', s=64, r=22, o=.2, depth=.6, bt=12, bd=5)],
     'a': [fl('cube', right='6%', top='14%', s=64, depth=.4, t=36), fl('sph', left='3%', bottom='12%', s=46, depth=.6, v='gold', bt=9), fl('paw', right='14%', bottom='10%', s=58, r=18, o=.2, depth=.3, bt=13), fl('paw', left='8%', top='12%', s=44, r=-20, o=.16, depth=.5, cls='hide-m', bt=14, bd=3)],
     'b': [fl('slab', right='4%', top='12%', s=100, depth=.3, bt=12), fl('sph', left='2%', top='60%', s=52, v='car', depth=.5, bt=10, bd=2), fl('paw', right='20%', bottom='8%', s=52, r=-14, o=.2, depth=.4, bt=12), fl('cube', right='22%', bottom='12%', s=44, depth=.6, v='gold', cls='hide-m', t=28)],
     'paws': [fl('paw', left='6%', top='12%', s=70, r=-16, o=.16, depth=.3, bt=13), fl('paw', right='8%', top='22%', s=90, r=20, o=.14, depth=.5, bt=15, bd=2), fl('paw', left='30%', bottom='6%', s=54, r=8, o=.14, depth=.2, cls='hide-m', bt=12, bd=4), fl('paw', right='24%', bottom='14%', s=66, r=-24, o=.16, depth=.6, bt=14, bd=6), fl('sph', left='4%', bottom='18%', s=40, v='gold', depth=.4, cls='hide-m', bt=9)],
    }
    return f'<div class="scene{" light-scene" if light else ""}" aria-hidden="true">{"".join(presets[name])}</div>'


def _wave(y, amp, per=720, n=4):
    h = per / 2; q = per / 3
    return 'M0 %d' % y + ''.join('c%d -%d %d -%d %d 0s%d %d %d 0' % (per/6, amp, q, amp, h, q, amp, h) for _ in range(n))

def hero_bg():
    """Cinematic hero background: gradient lights, WebGL scene (with CSS fallback), melting ribbons, paw trail."""
    bokeh = ''.join('<i style="--x:%s;--y:%s;--s:%dpx;--a:%s;--t:%ds;--d:-%ds"></i>' % b for b in [
        ('60%', '4%', 260, '.16', 24, 2), ('82%', '42%', 190, '.14', 28, 7), ('46%', '56%', 130, '.12', 21, 4), ('88%', '4%', 150, '.18', 26, 9),
        ('68%', '70%', 100, '.14', 19, 3), ('28%', '8%', 110, '.10', 30, 11), ('4%', '58%', 170, '.08', 34, 5), ('38%', '28%', 80, '.10', 23, 8)])
    paws = ''.join('<svg style="--x:%d%%;--y:%d%%;--r:%ddeg;--i:%d" viewBox="0 0 64 64"><use href="#paw"/></svg>' % (x, y, r, i) for i, (x, y, r) in enumerate(
        [(36, 6, -26), (46, 36, -12), (56, 8, -22), (66, 40, -10), (76, 10, -20), (86, 42, -8), (95, 12, -18)]))
    css = ''.join([
        fl('cube', right='8%', top='20%', s=92, depth=.5, v='gold', t=40, n=0), fl('slab', right='24%', top='52%', s=118, depth=.25, bt=12, n=1),
        fl('sph', right='6%', top='60%', s=70, depth=.7, v='car', cls='hide-m', bt=9, bd=2, n=2), fl('cube', right='36%', top='14%', s=56, depth=.35, cls='hide-m', t=30, n=3),
        fl('sph', right='30%', top='72%', s=44, depth=.6, bt=11, bd=4, n=4), fl('paw', right='3%', top='10%', s=64, r=22, o=.2, depth=.6, bt=12, bd=5, n=5)])
    spk = ''.join('<span class="spk" style="--x:%d%%;--y:%d%%;--s:%dpx;--t:%.1fs;--d:-%.1fs"></span>' % (x, y, sz, tt, d) for x, y, sz, tt, d in [
        (52, 14, 5, 4.2, 0), (66, 30, 4, 3.6, 1.2), (78, 12, 6, 5, 2.1), (90, 34, 4, 3.8, .6), (58, 62, 5, 4.6, 3), (72, 52, 4, 3.4, 1.8),
        (84, 70, 5, 4.9, 2.6), (94, 18, 4, 4, 3.4), (47, 40, 3, 3.5, .9), (62, 82, 4, 4.4, 2.2)])
    cr = _wave(96, 52); m1 = _wave(130, 44); m2 = _wave(112, 38, 720)
    melt = (
     '<div class="hb-melt"><svg class="m3" viewBox="0 0 2880 230" preserveAspectRatio="none"><defs><linearGradient id="gcar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#B97B45"/><stop offset=".5" stop-color="#E2B069"/><stop offset="1" stop-color="#B97B45"/></linearGradient></defs>'
     '<path d="%s" fill="none" stroke="url(#gcar)" stroke-width="15" stroke-linecap="round"/><path d="%s" fill="none" stroke="#F6E3B4" stroke-opacity=".55" stroke-width="3" transform="translate(0 -4)"/></svg>'
     '<svg class="m2" viewBox="0 0 2880 230" preserveAspectRatio="none"><defs><linearGradient id="gch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a3a28"/><stop offset=".35" stop-color="#3f2218"/><stop offset="1" stop-color="#281611"/></linearGradient></defs>'
     '<path d="%sV230H0Z" fill="url(#gch)"/><path d="%s" fill="none" stroke="#F0D79E" stroke-opacity=".45" stroke-width="2"/></svg>'
     '<svg viewBox="0 0 2880 230" preserveAspectRatio="none"><defs><linearGradient id="gfr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2018"/><stop offset=".5" stop-color="#2d1812"/><stop offset="1" stop-color="#281611"/></linearGradient></defs>'
     '<path d="%sV230H0Z" fill="url(#gfr)"/><path d="%s" fill="none" stroke="#D6AE65" stroke-opacity=".4" stroke-width="1.5"/></svg></div>') % (cr, cr, m2, m2, m1, m1)
    return ('<div class="hbg" id="hbg" aria-hidden="true"><div class="hb-light"></div><div class="hb-bokeh">' + bokeh + '</div>'
            '<div class="hb-beam b1"></div><div class="hb-beam b2"></div><div class="hb-ring"></div><div class="hb-trail">' + paws + '</div>'
            '<canvas id="gl"></canvas><div class="scene hb-css">' + css + spk + '</div>' + melt + '</div>')

def divider(prev):
    return f'<div class="div c-{prev}" aria-hidden="true"><svg viewBox="0 0 1200 64" preserveAspectRatio="none"><use href="#drip"/></svg></div>'

# ------------------------------------------------------------------ CARDS
def card(it, root=''):
    st = it['status']
    label = it.get('label', STATUS[st])
    h = f'<article class="item"><span class="status s-{st}"><i></i>{E(label)}</span><h3>{E(it["name"])}</h3><p>{E(it["desc"])}</p>'
    if it.get('themes'):
        h += '<ul class="themes" aria-label="Possible themes">' + ''.join(f'<li>{E(t)}</li>' for t in it['themes']) + '</ul>'
    if it.get('note'): h += f'<p class="note">{E(it["note"])}</p>'
    gold = it['action'] in ('order', 'preorder')
    h += '<div class="row">' + wa(wa_msg(it), 'btn btn-%s btn-sm' % ('gold' if gold else 'line'), BTN[it['action']], False, f' aria-label="{E(BTN[it["action"]] + ": " + it["name"])}"')
    h += f'<a class="more" href="{root}{it["href"]}" aria-label="Explore {E(it["name"])}">Explore</a></div></article>'
    return h

def cards(cat, root=''): return '<div class="list">' + ''.join(card(i, root) for i in ITEMS if i['cat'] == cat) + '</div>'

BULK_ITEM = dict(name='Bulk Orders for Events', status='pre', label='Pre-order Enquiry', desc='Chocolates for parties, events, functions, corporate gifts and celebrations.', note='Confirmed based on production capacity, pricing and delivery requirements.')
def bulk_card(root=''):
    return (f'<article class="item"><span class="status s-pre"><i></i>{BULK_ITEM["label"]}</span><h3>{BULK_ITEM["name"]}</h3><p>{BULK_ITEM["desc"]}</p><p class="note">{BULK_ITEM["note"]}</p>'
            f'<div class="row"><a class="btn btn-gold btn-sm" href="{root}bulk.html">Bulk Order Enquiry</a></div></article>')

# ------------------------------------------------------------------ PAGES
def page_index():
    h = head(f'{BRAND} | Beyond Chocolate…', 'MeltiQue Chocoland: premium chocolates, pre-order gifts and celebration boxes in Tirupur, Tamil Nadu. Order or enquire on WhatsApp.', '',
             '<meta name="keywords" content="MeltiQue Chocoland, premium chocolates, handmade chocolates, customized chocolates, chocolate gifts, personalized chocolates, bulk chocolate orders, chocolates in Tirupur, chocolates in Tamil Nadu">'
             f'<script type="application/ld+json">{{"@context":"https://schema.org","@type":"Store","name":"{BRAND}","slogan":"{TAG}","email":"{EMAIL}","address":{{"@type":"PostalAddress","streetAddress":"Parappalayam, Mangalam Road","addressLocality":"Tirupur","addressRegion":"Tamil Nadu","postalCode":"641604","addressCountry":"IN"}}}}</script>')
    b = header('', 'index.html') + '<main id="main">'
    b += f'''<section class="sec hero t-espresso" id="hero" aria-labelledby="h1">{hero_bg()}
<div class="wrap"><div class="hero-copy"><span class="eyebrow">Premium chocolates · Tirupur</span>
<h1 id="h1" data-tilt><span class="g">MeltiQue</span><span class="i">Chocoland</span><span class="tagline">{TAG}</span></h1>
<p class="hero-desc">Handcrafted moments, made to melt. Order your favourites on WhatsApp, reserve something special in advance, or visit our physical store.</p>
<div class="actions"><a class="btn btn-gold" id="exploreRing" href="#available">Explore Chocoland</a><a class="btn btn-line" href="#available">Explore Products</a></div>
<ul class="pills"><li class="pill">Available now</li><li class="pill">Pre-orders open</li><li class="pill">Physical store</li></ul></div></div></section>

<section class="sec t-choc" id="available" aria-labelledby="h-av">{divider('espresso')}{scene('a')}<div class="wrap">
<div class="head reveal"><p class="label">01 · Products</p><h2 class="h2 dim" id="h-av" data-xp>Available Now</h2><p class="lead">These can be ordered through WhatsApp. Please ask us about price and handover when you message.</p></div>
<div class="reveal">{cards('available')}</div></div></section>

<section class="sec t-cream" id="preorders" aria-labelledby="h-pre">{divider('choc')}{scene('b', light=True)}<div class="wrap">
<div class="head reveal"><p class="label">02 · Pre-order Collection</p><h2 class="h2 dim" id="h-pre" data-xp>Pre-order Available</h2><p class="lead">Reserve these in advance. A pre-order enquiry is not a confirmed order. We confirm availability, price, customization and the estimated date with you on WhatsApp first.</p></div>
<div class="reveal">{cards('pre')}</div></div></section>

<section class="sec t-burg" id="gifts" aria-labelledby="h-gift">{divider('cream')}{scene('paws')}<div class="wrap">
<div class="head reveal"><p class="label">03 · Create, Gift &amp; Celebrate</p><h2 class="h2 dim" id="h-gift" data-xp>Create, Gift &amp; Celebrate</h2><p class="lead">Creative chocolate gifting. Details are confirmed with you before any order is accepted.</p></div>
<div class="reveal"><div class="list">{''.join(card(i) for i in ITEMS if i['cat']=='gift')}{bulk_card()}</div></div></div></section>

<section class="sec t-char" id="lab" aria-labelledby="h-lab">{divider('burg')}{scene('a')}<div class="wrap">
<div class="head reveal"><p class="label">04 · Coming Soon</p><h2 class="h2 dim" id="h-lab" data-xp>The MeltiQue Lab · Coming Soon</h2><p class="lead">Ideas we are working on. None of these can be ordered yet, and any of them may change before launch.</p></div>
<div class="reveal">{cards('lab')}</div>
<p class="small reveal">More future chocolate concepts will appear here, always labelled as ideas.</p></div></section>

<section class="sec t-bronze" id="piku" aria-labelledby="h-piku">{divider('char')}{scene('paws')}<div class="wrap"><div class="reveal" style="max-width:780px">
<p class="label">05 · A future collection under {BRAND}</p><h2 class="h2 dim" id="h-piku" data-xp>Piku Chocolate</h2>
<p style="margin-top:14px"><span class="status s-soon"><i></i>Coming Soon</span></p>
<p class="lead">A playful line inspired by dogs. It may include dog-paw-shaped chocolates, cute dog-inspired shapes, paw-themed gift boxes, special dog-inspired collections and, later, chocolate pops and other novelty shapes.</p>
<p class="small">Piku Chocolate is not available for purchase yet.</p>
<div class="actions"><a class="btn btn-gold" href="piku.html">Explore Piku</a>{wa('Hi '+BRAND+'! I am interested in the Piku Chocolate collection. Please add me to the launch list.', 'btn btn-line', 'Join Launch List')}</div></div></div></section>

<section class="sec t-espresso" id="treasure" aria-labelledby="h-tr">{divider('bronze')}{scene('paws')}<div class="wrap"><div class="split">
<div class="reveal"><p class="label">06 · Play, discover &amp; surprise</p><h2 class="h2 dim" id="h-tr" data-xp>Treasure Club</h2>
<p style="margin-top:14px"><span class="status s-soon"><i></i>Coming Soon</span></p>
<p class="lead">A proposed collectible-reward idea. Customers collect eight qualifying collectible items and may redeem a chocolate reward box, subject to the final programme rules.</p>
<p class="small">Nothing is promised until the rules, qualifying products and costs are finalized.</p>
<div class="actions"><a class="btn btn-gold" href="treasure-club.html">Open the Treasure Chest</a>{wa('Hi '+BRAND+'! Please add me to the Treasure Club launch list.', 'btn btn-line', 'Join Launch List')}</div></div>
<div class="reveal" aria-hidden="true"><ol class="slots"><li>1</li><li>2</li><li>3</li><li>4</li><li>5</li><li>6</li><li>7</li><li>8</li></ol><p class="small">Eight collectibles, one possible reward box. Concept only.</p></div></div></div></section>

<section class="sec t-ivory" id="about" aria-labelledby="h-ab">{divider('espresso')}{scene('b', light=True)}<div class="wrap split">
<div class="reveal"><p class="label">07 · About {BRAND}</p><h2 class="h2 dim" id="h-ab" data-xp>Chocolate is only the beginning.</h2>
<p class="lead">At {BRAND}, we believe chocolate can be more than a sweet treat. It can carry a feeling, celebrate a moment, create a memory or simply make someone's day a little sweeter.</p>
<div class="actions"><a class="btn btn-gold" href="about.html">Read our story</a></div></div>
<div class="reveal"><p class="quote">Every creation is designed with attention to detail, creativity and the idea that the best chocolate experiences <em>go beyond chocolate.</em></p></div></div></section>

<section class="sec t-cream" id="find" aria-labelledby="h-find">{divider('ivory')}<div class="wrap"><div class="arch reveal">
<p class="label">08 · Physical store</p><h2 class="h2 dim" id="h-find">Find Us</h2>
<p class="lead">Visit our physical store. Contact us for the exact location and current availability before visiting.</p>
<p style="margin-top:16px;font-weight:500">{ADDRESS}</p>
<div class="actions">{wa('Hi '+BRAND+'! I would like to visit your store. Could you share the exact location and current availability?', 'btn btn-gold', 'Ask before visiting', True)}<a class="btn btn-line" href="find-us.html">Store details</a></div></div></div></section>

<section class="sec t-char" id="contact" aria-labelledby="h-contact">{divider('cream')}<div class="wrap split">
<div class="reveal"><p class="label">09 · Contact</p><h2 class="h2 dim" id="h-contact" data-xp>Let's talk chocolate.</h2><p class="lead">WhatsApp is the quickest way to order, pre-order or ask a question.</p>
<div class="actions">{wa('Hi '+BRAND+'! I would like to place an order.', 'btn btn-gold', 'Order on WhatsApp', True)}</div></div>
<dl class="facts reveal"><div><dt>Email</dt><dd><a href="mailto:{EMAIL}">{EMAIL}</a></dd></div><div><dt>Instagram</dt><dd><a href="{IG_URL}" target="_blank" rel="noopener">{IG_HANDLE}</a></dd></div><div><dt>Store</dt><dd>{ADDRESS}</dd></div></dl></div></section>
</main>'''
    b += footer('') + tail('', hero_js=True)
    write('index.html', h + b)

def simple_hero(theme, label, title, intro, scn='a', extra=''):
    return f'''<section class="sec ex-hero {theme}" aria-labelledby="h1">{scene(scn)}<div class="wrap"><div class="turn">{extra}
<p class="label">{label}</p><h1 id="h1" class="dim" data-xp>{title}</h1>{intro}</div></div></section>'''

def page_explore(it):
    root = '../'
    th = THEME[it['cat']]; cname, chref = CATS[it['cat']]
    st = it['status']; label = it.get('label', STATUS[st])
    h = head(f'{it["name"]} | {BRAND}', f'{it["name"]}: {it["desc"]} Status: {label}.', root)
    how = {
     'order': ('How ordering works', 'Tap the button to open WhatsApp with this product already named in your message. We will confirm price and handover details with you in the chat.'),
     'preorder': ('How pre-orders work', 'Send a pre-order enquiry on WhatsApp. We confirm availability, price, customization and the estimated fulfilment date with you. A pre-order is not confirmed until MeltiQue Chocoland tells you it is.'),
     'explore': ('Not available to order yet', 'This is an idea in development. It cannot be bought, and its design and availability may change. You can message us to explore the idea.'),
     'launch': ('Not available to order yet', 'This is an idea in development. It cannot be bought yet. Message us to be added to the launch list.'),
    }[it['action']]
    related = [r for r in ITEMS if r['cat'] == it['cat'] and r is not it][:3]
    themes = ''
    if it.get('themes'):
        themes = '<div class="callout"><h2>Possible themes</h2><ul class="ask">' + ''.join(f'<li>{E(t)}</li>' for t in it['themes']) + '</ul></div>'
    note = f'<div class="callout"><h2>Please note</h2><p>{E(it["note"])}</p></div>' if it.get('note') else ''
    b = header(root) + f'<main id="main">'
    b += f'''<section class="sec ex-hero {th}" aria-labelledby="h1">{scene('a')}<div class="wrap"><div class="turn">
<nav class="crumbs" aria-label="Breadcrumb"><a class="more" href="{root}index.html">Home</a><a class="more" href="{root}{chref}">← Back to {E(cname)}</a></nav>
<span class="status s-{st}"><i></i>{E(label)}</span>
<h1 id="h1" class="dim" data-xp>{E(it["name"])}</h1>
<p class="lead" style="font-size:1.2rem">{E(it["desc"])}</p>
{themes}{note}
<div class="callout"><h2>{how[0]}</h2><p>{how[1]}</p></div>
<div class="callout"><h2>Details</h2><p>Price, weight and ingredient details are not listed on this website. Please ask us on WhatsApp.</p></div>
<div class="actions">{wa(wa_msg(it), 'btn btn-gold' if it['action'] in ('order','preorder') else 'btn btn-gold', BTN[it['action']], True)}<a class="btn btn-line" href="{root}{chref}">Back to {E(cname)}</a></div>
</div></div></section>
<section class="sec {th}" aria-labelledby="h-rel" style="padding-top:0"><div class="wrap"><div class="cat-head"><h2 id="h-rel" style="font-size:1.8rem">Related</h2><p>More from {E(cname)}.</p></div>
<div class="list">{''.join(card(r, root) for r in related)}</div></div></section>
</main>''' + footer(root) + tail(root)
    write(f'explore/{it["slug"]}.html', h + b)

def page_list(fname, theme, title, label, intro, cat, desc):
    h = head(f'{title} | {BRAND}', desc, '')
    b = header('', fname) + '<main id="main">' + simple_hero(theme, label, title, f'<p class="lead">{intro}</p>', 'a')
    b += f'<section class="sec {theme}" style="padding-top:0"><div class="wrap">{cards(cat)}<p class="small">More future chocolate concepts will appear here, always labelled as ideas.</p></div></section></main>'
    write(fname, h + b + footer('') + tail(''))

def page_piku():
    h = head(f'Piku Chocolate | {BRAND}', 'Piku Chocolate is a future playful collection under MeltiQue Chocoland, inspired by dogs. Coming soon.', '')
    ideas = ['Dog-paw-shaped chocolates', 'Cute dog-inspired chocolate shapes', 'Paw-themed chocolate gift boxes', 'Special collections inspired by dogs', 'Future chocolate pops and other novelty shapes']
    b = header('', '') + '<main id="main">'
    b += f'''<section class="sec ex-hero t-bronze" aria-labelledby="h1">{scene('paws')}<div class="wrap"><div class="turn">
<nav class="crumbs" aria-label="Breadcrumb"><a class="more" href="index.html">Home</a><a class="more" href="lab.html">← The MeltiQue Lab</a></nav>
<p class="label">A future collection under {BRAND}</p><h1 id="h1" class="dim" data-xp>Piku Chocolate</h1>
<p style="margin-top:14px"><span class="status s-soon"><i></i>Coming Soon</span></p>
<p class="lead" style="font-size:1.2rem">A playful line inspired by dogs, built on the paw that already runs through {BRAND}. It is an idea in development and cannot be bought yet.</p></div></div></section>
<section class="sec t-cream" aria-labelledby="h-i">{divider('bronze')}<div class="wrap"><div class="head reveal"><p class="label">The concept</p><h2 class="h2 dim" id="h-i" data-xp>What Piku may become</h2></div>
<div class="list reveal">{''.join(f'<article class="item"><span class="status s-soon"><i></i>Idea</span><h3>{i}</h3></article>' for i in ideas)}</div>
<p class="small">Nothing on this page is for sale. Shapes, flavours and availability will be confirmed if and when the collection launches.</p>
<div class="actions">{wa('Hi '+BRAND+'! I am interested in the Piku Chocolate collection. Please add me to the launch list.', 'btn btn-gold', 'Join Launch List', True)}<a class="btn btn-line" href="lab.html">See the MeltiQue Lab</a></div></div></section>
</main>'''
    write('piku.html', h + b + footer('') + tail(''))

def page_treasure():
    h = head(f'Treasure Club | {BRAND}', 'Treasure Club is a coming-soon collectible-reward idea from MeltiQue Chocoland. Rules and rewards are not yet final.', '')
    coins = ''.join(f'<span class="coin" style="--cx:{x}px;--cd:-{d}s;--ct:{t}s"><svg aria-hidden="true"><use href="#paw"/></svg></span>' for x, d, t in ((-60, 0, 7), (0, 2.3, 8), (62, 4.1, 6.5), (-24, 5.2, 9), (30, 1.2, 7.5)))
    chest = f'''<div class="chest-wrap" aria-hidden="true"><div class="chest">
<span class="f in"></span><span class="f bt"></span><span class="f bk"></span><span class="f lf"></span><span class="f rt"></span><span class="f fr"></span><span class="lock"></span>
<div class="lid"><div class="lidbox"><span class="f bm"></span><span class="f bk"></span><span class="f lf"></span><span class="f rt"></span><span class="f fr"></span><span class="f tp"></span></div></div>
{coins}</div></div>'''
    b = header('', 'treasure-club.html') + '<main id="main">'
    b += f'''<section class="sec ex-hero t-espresso" aria-labelledby="h1">{scene('paws')}<div class="wrap split"><div class="turn">
<nav class="crumbs" aria-label="Breadcrumb"><a class="more" href="index.html">Home</a><a class="more" href="lab.html">← The MeltiQue Lab</a></nav>
<p class="label">Play, discover &amp; surprise</p><h1 id="h1" class="dim" data-xp>Treasure Club</h1>
<p style="margin-top:14px"><span class="status s-soon"><i></i>Coming Soon</span></p>
<p class="lead" style="font-size:1.15rem">A proposed collectible-reward idea. Customers collect eight qualifying collectible items. Eligible collections may be redeemed for a chocolate reward box, subject to the final programme terms.</p></div>{chest}</div></section>
<section class="sec t-char" aria-labelledby="h-how">{divider('espresso')}<div class="wrap split"><div class="reveal"><p class="label">The idea</p><h2 class="h2 dim" id="h-how" data-xp>How it could work</h2>
<ul class="tl" style="margin-top:30px"><li><h3>Collect</h3><p>Eligible collectible items come with designated products. Which products qualify has not been decided.</p></li>
<li><h3>Reach eight</h3><p>After collecting eight qualifying items, a customer may be able to redeem a reward.</p></li>
<li><h3>Redeem</h3><p>The reward may be a chocolate box with chocolate bars or other eligible chocolates chosen by the business.</p></li></ul></div>
<div class="reveal"><ol class="slots"><li>1</li><li>2</li><li>3</li><li>4</li><li>5</li><li>6</li><li>7</li><li>8</li></ol>
<div class="callout"><h2>Please note</h2><p>Reward eligibility, qualifying items, redemption and availability will be confirmed in the official programme rules when Treasure Club launches. No free reward is promised until the rules and costs are final.</p></div>
<div class="actions">{wa('Hi '+BRAND+'! I would like to know more about the Treasure Club idea.', 'btn btn-line', 'Explore Idea')}{wa('Hi '+BRAND+'! Please add me to the Treasure Club launch list.', 'btn btn-gold', 'Join Launch List', True)}</div></div></div></section></main>'''
    write('treasure-club.html', h + b + footer('') + tail(''))

def page_about():
    h = head(f'About {BRAND}', f'The story and idea behind {BRAND}: chocolate as a feeling, a gift and a moment. Beyond chocolate…', '')
    b = header('', 'about.html') + '<main id="main">'
    b += simple_hero('t-espresso', f'About {BRAND}', 'Chocolate is only the beginning.', f'<p class="lead" style="font-size:1.15rem">At {BRAND}, we believe chocolate can be more than a sweet treat. It can carry a feeling, celebrate a moment, create a memory or simply make someone\'s day a little sweeter.</p>', 'a')
    b += f'''<section class="sec t-ivory" aria-labelledby="h-m">{divider('espresso')}{scene('b', light=True)}<div class="wrap split"><div class="reveal"><p class="label">The idea</p><h2 class="h2 dim" id="h-m" data-xp>{TAG}</h2>
<p class="lead">The line is not a slogan about size or price. It means that what matters is what the chocolate becomes: a craving, a celebration, a surprise, a memory or a moment shared with someone special.</p></div>
<div class="reveal"><p class="quote">Every creation is designed with attention to detail, creativity and the idea that the best chocolate experiences <em>go beyond chocolate.</em></p></div></div></section>
<section class="sec t-choc" aria-labelledby="h-t">{divider('ivory')}<div class="wrap split"><div class="reveal"><p class="label">Where we are heading</p><h2 class="h2 dim" id="h-t" data-xp>Our direction</h2>
<p class="lead">No dates here, only the order of ideas.</p></div>
<ol class="tl reveal"><li><h3>Chocolate you can order today</h3><p>Chocolate bars and flavoured chocolates, cookies, bombs and more, ordered on WhatsApp. <a class="more" href="index.html#available">See Available Now</a></p></li>
<li><h3>Made to order and made your way</h3><p>Pre-orders, personalized chocolates, celebration boxes, bulk orders for events and creative gifting. <a class="more" href="index.html#preorders">See Pre-orders</a></p></li>
<li><h3>Playful collections</h3><p>A growing set of ideas, including Piku Chocolate and the Treasure Club, still in development. <a class="more" href="piku.html">Piku</a> <a class="more" href="treasure-club.html">Treasure Club</a></p></li>
<li><h3>The MeltiQue Lab</h3><p>Puzzle chocolates, a Surprise Discovery Box and other experiments. Ideas first, products only when they are ready. <a class="more" href="lab.html">Open the Lab</a></p></li></ol></div></section>
<section class="sec t-cream" aria-labelledby="h-c">{divider('choc')}<div class="wrap"><div class="panel reveal"><p class="label">Say hello</p><h2 class="h2 dim" id="h-c">Have something in mind?</h2><p class="lead">Tell us the occasion and we will talk through what is possible.</p>
<div class="actions">{wa('Hi '+BRAND+'!', 'btn btn-gold', 'Chat on WhatsApp', True)}<a class="btn btn-line" href="find-us.html">Find Us</a></div></div></div></section></main>'''
    write('about.html', h + b + footer('') + tail(''))

def page_find():
    h = head(f'Find Us | {BRAND}', f'Visit the {BRAND} physical store at Parappalayam, Mangalam Road, Tirupur, Tamil Nadu 641604. Contact us before visiting.', '')
    b = header('', 'find-us.html') + '<main id="main">'
    b += f'''<section class="sec ex-hero t-cream" aria-labelledby="h1"><div class="wrap"><div class="arch turn"><p class="label">Physical store</p><h1 id="h1" class="dim" data-xp>Visit our physical store</h1>
<p class="lead">Visit our physical store. Contact us for the exact location and current availability before visiting.</p>
<p style="margin-top:18px;font:500 1.3rem/1.4 var(--fd)">{ADDRESS}</p>
<div class="actions">{wa('Hi '+BRAND+'! I would like to visit your store. Could you share the exact location and current availability?', 'btn btn-gold', 'Ask before visiting', True)}</div></div></div></section>
<section class="sec t-ivory" aria-labelledby="h-d">{divider('cream')}<div class="wrap split"><div class="reveal"><p class="label">Details</p><h2 class="h2 dim" id="h-d" data-xp>Before you come</h2><p class="lead">Opening hours and a map pin are not listed here. Please message us first so we can share the exact location and tell you what is available.</p></div>
<dl class="facts reveal"><div><dt>Address</dt><dd>{ADDRESS}</dd></div><div><dt>WhatsApp</dt><dd><a data-wa="Hi {BRAND}!" href="https://wa.me/{WAN}?text={quote('Hi '+BRAND+'!')}" target="_blank" rel="noopener">Chat on WhatsApp</a></dd></div><div><dt>Email</dt><dd><a href="mailto:{EMAIL}">{EMAIL}</a></dd></div><div><dt>Instagram</dt><dd><a href="{IG_URL}" target="_blank" rel="noopener">{IG_HANDLE}</a></dd></div></dl></div></section></main>'''
    write('find-us.html', h + b + footer('') + tail(''))

def page_bulk():
    h = head(f'Bulk Orders for Events | {BRAND}', f'Bulk chocolate orders for parties, events, functions, corporate gifts and celebrations from {BRAND}. Enquire on WhatsApp.', '')
    b = header('', '') + '<main id="main">'
    b += f'''<section class="sec ex-hero t-cream" aria-labelledby="h1">{scene('b', light=True)}<div class="wrap"><div class="turn">
<nav class="crumbs" aria-label="Breadcrumb"><a class="more" href="index.html">Home</a><a class="more" href="index.html#gifts">← Create, Gift &amp; Celebrate</a></nav>
<span class="status s-pre"><i></i>Pre-order Enquiry</span><h1 id="h1" class="dim" data-xp>Bulk Orders for Events</h1>
<p class="lead" style="font-size:1.15rem">Chocolates for parties, celebrations, functions, corporate gifts and other events. Tell us what you need and we will come back to you on WhatsApp.</p>
<div class="callout"><h2>Please note</h2><p>Pricing, availability, production capacity and delivery must be confirmed before a bulk order is accepted. Sending an enquiry does not confirm an order.</p></div>
<form class="form" id="bulkForm" aria-label="Bulk order enquiry">
<label for="b-occ">Occasion or event<input id="b-occ" name="occasion" type="text" autocomplete="off"></label>
<div class="fgrid"><label for="b-qty">Approximate quantity<input id="b-qty" name="qty" type="text" autocomplete="off"></label>
<label for="b-date">Required date<input id="b-date" name="date" type="text" placeholder="For example, 12 November" autocomplete="off"></label></div>
<label for="b-prod">Preferred products<textarea id="b-prod" name="products"></textarea></label>
<label for="b-cus">Customization needs<textarea id="b-cus" name="custom"></textarea></label>
<div class="actions" style="margin-top:4px"><a class="btn btn-gold" id="bulkSend" data-bulk href="https://wa.me/{WAN}?text={quote('Hi '+BRAND+'! Bulk order enquiry.')}" target="_blank" rel="noopener"><svg aria-hidden="true"><use href="#wa"/></svg>Send enquiry on WhatsApp</a></div>
<p class="small">This form does not send anything to a server. It writes your message in WhatsApp, and you choose whether to send it.</p></form>
</div></div></section></main>'''
    write('bulk.html', h + b + footer('') + tail(''))

def page_legal(fname, title, body):
    h = head(f'{title} | {BRAND}', f'{title} for {BRAND}.', '')
    b = header('') + f'<main id="main" class="legal t-espresso"><div class="wrap"><p class="label">Policies</p><h1 class="dim">{title}</h1>{body}<div class="actions"><a class="btn btn-gold btn-sm" href="index.html">Back to home</a></div></div></main>'
    write(fname, h + b + footer('') + tail(''))

PRIVACY = f'''<p class="small">This page describes how {BRAND} handles information you share when you contact us.</p>
<h2>What this website does and does not collect</h2><p>This website has no accounts, sign-up or online checkout, and it does not take payments. The bulk order form only writes a message in WhatsApp on your device. Nothing you type in it is sent to this website's server.</p>
<h2>Information you send us</h2><p>When you open WhatsApp from a button, or send an email, you choose what to share. This usually includes your name, phone number or email address, the product you ask about, and details such as occasion, quantity, customization and date. Details you give us in the store or on Instagram are handled the same way.</p>
<h2>How we use it</h2><ul><li>To reply to your enquiry and confirm availability, price and dates.</li><li>To prepare and hand over an order you have confirmed with us.</li><li>To tell you about a launch, only if you ask to join a launch list.</li></ul>
<h2>Chocolate guide</h2><p>The chocolate guide character on this website can ask for your first name so that it can greet you. The name is kept only in your browser for the current visit and is not sent to us or to any server. It is included in a WhatsApp message only if you choose to tap one of the WhatsApp buttons. The guide's optional voice uses your device's built-in text-to-speech.</p>
<h2>Guide enquiries</h2><p>If the guide's enquiry form is switched on, it asks for your name, a phone number or email, and your message, and only after you tick a consent box and review the summary. Pressing Send transmits those details over HTTPS to a small server function that forwards them to {BRAND} by email. The function does not keep a copy. The chat itself is never stored: it disappears when you close or reload the page. If the form is not switched on, the guide collects nothing and offers WhatsApp or email instead.</p>
<h2>Third-party services</h2><p>WhatsApp, Instagram and Gmail are run by other companies and have their own privacy terms. This website also loads fonts from Google Fonts and, on the home page, a 3D library from cdnjs. Those hosts can see your IP address and browser details when the page loads.</p>
<h2>Your choices</h2><p>You can ask us to stop messaging you, or to delete the details you sent us, by writing to <a href="mailto:{EMAIL}">{EMAIL}</a> or on WhatsApp.</p>
<h2>Contact</h2><p>{BRAND}, {ADDRESS}. Email: <a href="mailto:{EMAIL}">{EMAIL}</a>.</p>
<p class="todo">Owner to confirm: how long enquiry details are kept, and whether any analytics or other tools are used on this website.</p>'''
TERMS = f'''<p class="small">These terms explain how orders and enquiries work with {BRAND}.</p>
<h2>Enquiries are not orders</h2><p>Sending a WhatsApp or email enquiry does not confirm an order. An order is confirmed only when {BRAND} tells you it is confirmed and, where required, the advance payment is made.</p>
<h2>Available Now products</h2><p>Products marked "Available Now" can be ordered through WhatsApp. Please ask about current stock, price and handover before you pay.</p>
<h2>Pre-orders</h2><p>Products marked "Pre-order Available" are reserved in advance and are subject to confirmation of availability, price, customization and the estimated fulfilment date. For applicable custom and gift pre-orders, 50% of the order amount is payable in advance to confirm the order. The remaining 50% is payable according to {BRAND}'s final payment terms.</p>
<h2>Coming Soon and concept items</h2><p>Items marked "Coming Soon" or "Concept in Development", including Treasure Club, The MeltiQue Lab items and Piku Chocolate, are ideas. Their design, contents, rules and availability can change, or they may not launch. Joining a launch list is only an expression of interest.</p>
<h2>Bulk orders</h2><p>Bulk orders are accepted only after quantity, price, production capacity and delivery requirements have been confirmed with you.</p>
<h2>Personalized orders</h2><p>Exact customization is confirmed with you before the order is accepted.</p>
<h2>Cancellations and refunds</h2><p class="todo">Owner to confirm: cancellation and refund terms. Until these are published here, please ask on WhatsApp about cancellation and refunds before you pay anything.</p>
<h2>Visiting the store</h2><p>Please contact us for the exact location and current availability before visiting.</p>
<h2>Contact</h2><p>Email: <a href="mailto:{EMAIL}">{EMAIL}</a>. See also our <a href="privacy.html">Privacy Policy</a>.</p>'''

def page_404():
    h = head(f'Page not found | {BRAND}', 'This page could not be found.', '')
    write('404.html', h + header('') + f'<main id="main" class="legal t-espresso"><div class="wrap"><p class="label">404</p><h1 class="dim">This page has melted away.</h1><div class="actions"><a class="btn btn-gold" href="index.html">Back to home</a></div></div></main>' + footer('') + tail(''))

if __name__ == '__main__':
    import json
    write('js/config.js', '/* Generated by _build/build.py. Set WA_NUMBER, GUIDE_NAME and PRICES there, then rebuild. */\nwindow.MQ = {\n  whatsappNumber: "%s",\n  logoSrc: "",\n  guideName: %s,\n  prices: %s,\n  enquiryEndpoint: %s\n};\n' % (WAN, json.dumps(GUIDE_NAME), json.dumps(PRICES, ensure_ascii=False), json.dumps(ENQUIRY_URL)))
    gd = [dict(name=i['name'], cat=i['cat'], status=i['status'], label=i.get('label', STATUS[i['status']]), action=i['action'], desc=i['desc'], note=i.get('note', ''), href=i['href'], themes=i.get('themes', []), types=TYPES.get(i['name'], []), image=IMAGES.get(i['name'], '')) for i in ITEMS]
    write('js/guide-data.js', '/* Generated by _build/build.py from the product list. */\nwindow.MQ_PRODUCTS = %s;\nwindow.MQ_INFO = %s;\n' % (json.dumps(gd, ensure_ascii=False), json.dumps(dict(brand=BRAND, address=ADDRESS, instagram=IG_URL), ensure_ascii=False)))
    page_index()
    for it in ITEMS:
        if it['href'].startswith('explore/'): page_explore(it)
    page_list('lab.html', 't-char', 'The MeltiQue Lab · Coming Soon', 'Upcoming collections', 'Ideas we are working on. None of these can be ordered yet, and any of them may change before launch.', 'lab', f'The MeltiQue Lab: future chocolate ideas from {BRAND}, including Puzzle Chocolates, Surprise Discovery Box and Piku Chocolate. All coming soon.')
    page_piku(); page_treasure(); page_about(); page_find(); page_bulk()
    page_legal('privacy.html', 'Privacy Policy', PRIVACY)
    page_legal('terms.html', 'Terms & Conditions', TERMS)
    page_404()
    print('built', len([f for r, d, fs in os.walk(OUT) for f in fs if f.endswith('.html')]), 'pages')
