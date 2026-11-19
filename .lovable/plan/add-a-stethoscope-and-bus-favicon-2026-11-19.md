# Add a stethoscope and bus favicon

The browser tab icon will be a small badge showing a bus (the mobile health fair) with a stethoscope draped over it, drawn as a crisp vector so it stays sharp at any size.

## Steps
1. Create `public/favicon.svg`: a rounded square in a teal/medical green, with a simple white bus silhouette and a stethoscope (earpieces, tube and chest piece) curving across it.
2. Add `<link rel="icon" href="/favicon.svg" type="image/svg+xml">` to the head of `index.html`.
3. Delete `public/favicon.ico`. Browsers look for this file by default, so leaving it would override the new icon.
4. Check that the icon renders cleanly at tab size.
