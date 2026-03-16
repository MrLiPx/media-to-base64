# Base64 Image Converter

🖼️ A free, open-source, privacy-first tool to convert between Base64 strings and images — no signup, no server, no tracking.

**Live site:** [mrlipx.github.io/base64-image-converter](https://mrlipx.github.io/base64-image-converter/)

---

## Features

### Base64 → Image
- Paste any Base64 string (raw or Data URL) and preview the image instantly
- Auto-detects format from magic bytes (PNG, JPEG, GIF, WebP, SVG, BMP, ICO)
- One-click image download
- Ctrl+Enter keyboard shortcut for quick conversion

### Image → Base64
- Drag & drop or click-to-upload any image file
- Choose between Data URL (`data:image/png;base64,…`) or raw Base64 output
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
| Works offline | ✅ Pure HTML/JS |
| Supported formats | PNG, JPEG, GIF, WebP, SVG, BMP, ICO |

All processing is done entirely in your browser using standard Web APIs (`FileReader`, `HTMLImageElement`). No data ever leaves your device.

---

## Project Structure

```
base64-image-converter/
├── index.html              # Base64 → Image converter
├── image-to-base64/
│   └── index.html          # Image → Base64 converter
├── privacy/
│   └── index.html          # Privacy policy
├── terms/
│   └── index.html          # Terms of service
├── 404.html                # Custom 404 page
├── site.webmanifest        # PWA manifest
├── LICENSE                 # MIT License
└── README.md
```

---

## Deploying to GitHub Pages

1. Fork or clone this repository
2. Go to **Settings → Pages**
3. Set source to **Deploy from a branch** → `main` → `/ (root)`
4. Your site will be live at `https://<your-username>.github.io/base64-image-converter/`

> **Note:** All internal links use the `/base64-image-converter/` path prefix. If you deploy at a different path, do a find-and-replace on that string.

---

## Local Development

No build step required — this is a pure static site.

```bash
git clone https://github.com/MrLiPx/base64-image-converter.git
cd base64-image-converter

# Option 1: Python
python3 -m http.server 8080

# Option 2: Node
npx serve .

# Then open: http://localhost:8080/base64-image-converter/
```

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

For bugs and ideas, use [GitHub Issues](https://github.com/MrLiPx/base64-image-converter/issues) or [Discussions](https://github.com/MrLiPx/base64-image-converter/discussions).

---

## License

MIT © 2026 [MrLiPx](https://github.com/MrLiPx)

See [LICENSE](LICENSE) for full text.
