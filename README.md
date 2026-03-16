# Base64 Image Converter

🖼️ A free, open-source, privacy-first tool to convert between Base64 strings and images — no signup, no server, no tracking.

**Live site:** [mrlipx.github.io/base64-image-converter](https://mrlipx.github.io/base64-image-converter/)

---

## Features

### Base64 → Image
- Paste any Base64 string (raw or Data URL) and preview the image instantly
- **Auto-converts on paste** — no need to click a button
- Auto-detects format from mime type or magic byte prefixes (PNG, JPEG, GIF, WebP, SVG, BMP, ICO)
- Shows pixel dimensions, mime type, and estimated file size
- One-click image download with correct filename/extension
- `Ctrl`+`Enter` keyboard shortcut

### Image → Base64
- Drag & drop or click-to-upload any image file (max 10 MB)
- Toggle between **Data URL** (`data:image/png;base64,…`) and **Raw Base64** output
- One-click copy to clipboard
- Character count display

---

## Why This Tool?

| Feature | This tool |
|---------|-----------|
| Server uploads | ❌ Never |
| Account required | ❌ No |
| Tracking / ads | ❌ None |
| Open source | ✅ MIT License |
| Build step required | ✅ None — pure HTML/CSS/JS |
| Works offline (after first load) | ✅ Yes |
| Supported formats | PNG, JPEG, GIF, WebP, SVG, BMP, ICO |

All processing is done entirely in your browser using standard Web APIs (`FileReader`, `HTMLImageElement`). No data ever leaves your device.

---

## Project Structure

```
base64-image-converter/
├── index.html              # Base64 → Image converter (homepage)
├── styles.css              # Shared stylesheet for all pages
├── image-to-base64/
│   └── index.html          # Image → Base64 converter
├── privacy/
│   └── index.html          # Privacy policy
├── terms/
│   └── index.html          # Terms of service
├── 404.html                # Custom 404 page
├── site.webmanifest        # PWA/app manifest
├── favicon.ico             # Favicon
├── logo.svg                # Logo SVG
├── image/                  # OG/social preview images
│   ├── base64-to-image.png
│   └── image-to-base64.png
├── .nojekyll               # Disables Jekyll processing on GitHub Pages
├── LICENSE                 # MIT License
└── README.md
```

---

## Deploying to GitHub Pages

1. Fork or clone this repository
2. Go to **Settings → Pages**
3. Set source to **Deploy from a branch** → `main` → `/ (root)`
4. Your site will be live at `https://<your-username>.github.io/base64-image-converter/`

> **Note:** All internal links use the `/base64-image-converter/` base path. If you rename the repository, do a find-and-replace on that string across all HTML and CSS files.

---

## Local Development

No build step required — this is a pure static site.

```bash
git clone https://github.com/MrLiPx/base64-image-converter.git
cd base64-image-converter

# Python
python3 -m http.server 8080

# Node
npx serve .

# Then open: http://localhost:8080/base64-image-converter/
```

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add: my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

For bugs and ideas, use [GitHub Issues](https://github.com/MrLiPx/base64-image-converter/issues) or [Discussions](https://github.com/MrLiPx/base64-image-converter/discussions).

---

## License

MIT © 2026 [MrLiPx](https://github.com/MrLiPx) — see [LICENSE](LICENSE) for full text.
