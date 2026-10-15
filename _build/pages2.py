"""Extra pages: Design Studio, Gift Architect, Message Generator, Virtual Unboxing, Celebrations, Customer Moments."""
import html as _h
E = lambda s: _h.escape(str(s), quote=True)

def build(B):
    def shell(fname, title, desc, theme, label, h1, intro, body, scripts=''):
        h = B.head(f'{title} | {B.BRAND}', desc, '')
        b = B.header('', fname) + '<main id="main">' + B.simple_hero(theme, label, h1, f'<p class="lead">{intro}</p>', 'a')
        b += f'<section class="sec {theme}" style="padding-top:0"><div class="wrap">{body}</div></section></main>' + B.footer('')
        t = B.tail('')
        t = t.replace('</body>', scripts + '</body>')
        B.write(fname, h + b + t)

    nojs = '<noscript><p class="callout">This tool needs JavaScript. You can still message us on WhatsApp or by email.</p></noscript>'
    status_note = '<p class="small" id="apiNote"></p>'

    shell('studio.html', 'Design Studio', 'Design a personalised chocolate gift, preview it, add flowers if you like, and send the design to MeltiQue Chocoland for review.',
          't-burg', 'Discover · Personalize · Preview · Submit', 'Design your own chocolate',
          'Pick a shape, personalise it, preview the finished gift and send the design to us. It is an enquiry: we confirm feasibility and availability before anything is made.',
          nojs + '<div id="studio" class="studio" aria-live="polite"></div>' + status_note,
          '<script src="js/studio.js" defer></script>')

    shell('gift-architect.html', 'Gift Architect', 'Answer a few questions and get gift ideas from the real MeltiQue Chocoland catalogue.',
          't-cream', 'Find the right gift', 'Chocolate Gift Architect',
          'Tell us who the gift is for and we will suggest ideas from our real catalogue. Availability is always confirmed by the team.',
          nojs + '<div id="gift" class="gift" aria-live="polite"></div>', '<script src="js/gift.js" defer></script>')

    shell('messages.html', 'Message Generator', 'Write a short message for a personalised chocolate or gift card with AI help.',
          't-char', 'Say it sweetly', 'Chocolate message generator',
          'Choose a tone and the name of the person, and AI will suggest short messages. You edit and confirm; nothing is printed until the team confirms your order.',
          nojs + '<div id="msgs" class="gift" aria-live="polite"></div>', '<script src="js/messages.js" defer></script>')

    shell('unbox.html', 'Virtual Unboxing', 'Open a virtual gift box and preview your personalised chocolate design.',
          't-espresso', 'Open your gift', 'Virtual unboxing',
          'A preview of your own design inside a gift box. It is a concept illustration, not a photo of the finished product.',
          nojs + '<div id="unbox" class="unbox" aria-live="polite"></div>', '<script src="js/unbox.js" defer></script>')

    shell('celebrations.html', 'Celebrations', 'Seasonal chocolate gifting ideas and countdowns from MeltiQue Chocoland.',
          't-bronze', 'Chocolate celebrations', 'Celebration countdown',
          'Gifting ideas for festivals and special days. Dates and products are confirmed with the team; nothing here is a discount or a guaranteed offer.',
          nojs + '<div id="camps" class="camps" aria-live="polite"></div>')

    if B.GALLERY:
        items = ''.join(f'<figure class="shot"><img src="{E(g["src"])}" alt="{E(g.get("alt", ""))}" loading="lazy"><figcaption>{E(g.get("caption", ""))}</figcaption></figure>' for g in B.GALLERY)
        gal = f'<div class="gallery">{items}</div>'
    else:
        gal = '<div class="callout"><h2>Photos coming soon</h2><p>This gallery will show real gifts made by MeltiQue Chocoland, with permission from the people involved. We do not publish made-up reviews or stock photos here.</p></div>'
    gal += f'<div class="callout"><h2>Share your moment</h2><p>Made a gift with us? Send a photo on <a href="{B.IG_URL}" target="_blank" rel="noopener">Instagram</a> or WhatsApp, and tell us if we may feature it. We publish photos only after you say yes.</p></div>'
    shell('moments.html', 'Customer Moments', 'Real gifting moments from MeltiQue Chocoland customers, shared with permission.',
          't-ivory', 'Moments', 'Customer moments', 'Real gifts and celebrations, shown only with permission.', gal)
