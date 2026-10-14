# MeltiQue Chocoland website (GitHub Pages)

35 static pages: home, About, Find Us, Bulk Orders, The MeltiQue Lab, Piku Chocolate, Treasure Club,
Privacy, Terms, a 404 page, and one Explore page for every product and concept (explore/ folder).

## Before publishing
1. Open `js/config.js` and paste the SAME WhatsApp number your current site uses
   (digits with country code, e.g. 91XXXXXXXXXX). Every WhatsApp button picks it up.
2. Check the Instagram link and email in the footer match your live site (they are set in `_build/build.py`:
   IG_URL, EMAIL). If you have a logo file, put it in `assets/` and set `logoSrc` in `js/config.js`.

## Publish
1. On github.com open your website repository, then Add file > Upload files.
2. Drag in everything from this folder, keeping the folders (css, js, explore, assets, _build).
   Files with the same name replace the old ones.
3. Delete old pages you no longer use (trash icon on each file), then Commit changes.
4. Wait about a minute, then hard refresh the live site (Ctrl+Shift+R).

## Changing products
Product names, descriptions, statuses and notes are in `_build/build.py` (the ITEMS list).
After editing, run `python3 _build/build.py` and upload the regenerated files.
Or send the changes to Claude and ask for a rebuilt ZIP.

## Chocolate guide (Koko)
An original anime-style guide appears on every page (bottom-right). She asks the visitor's name, helps them choose from the real product list and opens WhatsApp with the right message. Voice uses the visitor's device and can be muted.
- Change her name or add prices in `_build/build.py` (`GUIDE_NAME`, `PRICES`), then run `python3 _build/build.py` and upload the regenerated files.
- Example: `PRICES = {'Chocolate Bars': 'Rs. 150'}`. A product without a price tells visitors to ask on WhatsApp. Nothing is ever invented.

## Smart assistant (Koko)
- Understands typed questions in the browser (keyword/intent matching over the product list; no external AI, no keys).
- Never invents prices, chocolate types, ingredients or policies. Fill them in `_build/build.py`: `PRICES`, `TYPES` (dark/milk/white confirmed per product), `IMAGES` (your own photos).
- Enquiries: see `worker/README.md`. Until `MQ_ENQUIRY_URL` is set at build time, Koko collects no personal details and offers WhatsApp/email.
