/* ================================================================
   decoder.js — Base64 → Image converter logic
   Decodes to Blob, previews via blob: URL with a regular <img> tag
   ================================================================ */
(function () {
  'use strict';

  var _blobUrl = null;
  var _mime    = null;

  /* ── Mime detection from Base64 magic bytes ── */
  function detectMime(b64) {
    if (b64.startsWith('/9j/'))    return 'image/jpeg';
    if (b64.startsWith('R0lGOD')) return 'image/gif';
    if (b64.startsWith('UklGR'))  return 'image/webp';
    if (b64.startsWith('PHN2Z') || b64.startsWith('PD94b') || b64.startsWith('Pz94b')) return 'image/svg+xml';
    if (b64.startsWith('Qk0'))    return 'image/bmp';
    if (b64.startsWith('iVBOR')) return 'image/png';
    if (b64.startsWith('AAABAA') || b64.startsWith('AAABAAEAEBAQAAEABAAo')) return 'image/x-icon';
    return 'image/png';
  }

  /* ── Base64 → Blob ── */
  function b64ToBlob(b64, mime) {
    try {
      var binary = atob(b64);
      var buf = new Uint8Array(binary.length);
      for (var i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
      return new Blob([buf], { type: mime });
    } catch (e) {
      return null;
    }
  }

  /* ── Revoke previous blob URL ── */
  function revokeBlob() {
    if (_blobUrl) { URL.revokeObjectURL(_blobUrl); _blobUrl = null; }
  }

  /* ── Convert ── */
  window.convertB64 = function () {
    var raw   = (document.getElementById('b64input').value || '').trim();
    var errEl = document.getElementById('err-box');
    errEl.classList.remove('visible');

    if (!raw) { showToast('Paste a Base64 string first', 'error'); return; }

    var mime, b64clean;
    if (raw.startsWith('data:')) {
      var match = raw.match(/^data:([\w\/\+\-\.]+);base64,(.+)$/s);
      if (!match) { errEl.classList.add('visible'); return; }
      mime     = match[1];
      b64clean = match[2].replace(/\s+/g, '');
    } else {
      b64clean = raw.replace(/\s+/g, '');
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(b64clean)) {
        errEl.classList.add('visible'); return;
      }
      mime = detectMime(b64clean);
    }

    var blob = b64ToBlob(b64clean, mime);
    if (!blob) { errEl.classList.add('visible'); return; }

    revokeBlob();
    _blobUrl = URL.createObjectURL(blob);
    _mime    = mime;

    renderBlobLink(_blobUrl);

    var img = new Image();
    img.onload = function () {
      renderPreview(img, blob, mime);
      document.getElementById('dl-btn').disabled = false;
      showToast('Converted successfully', 'success');
    };
    img.onerror = function () {
      if (mime === 'image/svg+xml') {
        var svgImg = new Image();
        svgImg.src = _blobUrl;
        renderPreviewImg(svgImg, blob, mime, 0, 0);
        document.getElementById('dl-btn').disabled = false;
        showToast('Converted successfully', 'success');
      } else {
        revokeBlob(); _mime = null;
        errEl.classList.add('visible');
        document.getElementById('dl-btn').disabled = true;
      }
    };
    img.src = _blobUrl;
  };

  /* ── Blob link ── */
  function renderBlobLink(url) {
    var wrap = document.getElementById('blob-link-wrap');
    if (!wrap) return;
    wrap.innerHTML =
      '<a href="' + url + '" target="_blank" rel="noopener noreferrer" class="blob-link" title="Open image in new tab">' +
      '<i class="fi fi-rr-link" aria-hidden="true"></i>' +
      '<span class="blob-link-url">' + url + '</span>' +
      '<i class="fi fi-rr-arrow-right" aria-hidden="true"></i>' +
      '</a>';
    wrap.style.display = '';
  }

  /* ── Render <img> preview ── */
  function renderPreview(imgEl, blob, mime) {
    imgEl.alt   = 'Converted image';
    imgEl.title = 'Click to open in new tab';
    imgEl.style.cssText = 'max-width:100%;max-height:520px;display:block;margin:1.25rem auto;border-radius:6px;cursor:pointer;';
    imgEl.addEventListener('click', function () {
      window.open(_blobUrl, '_blank', 'noopener,noreferrer');
    });
    renderPreviewImg(imgEl, blob, mime, imgEl.naturalWidth, imgEl.naturalHeight);
  }

  function renderPreviewImg(imgEl, blob, mime, w, h) {
    var area  = document.getElementById('preview-area');
    var ph    = document.getElementById('preview-ph');
    var meta  = document.getElementById('img-meta');
    var badge = document.getElementById('fmt-badge');

    var old = area.querySelector('img');
    if (old) old.remove();
    ph.style.display = 'none';
    area.classList.add('loaded');
    area.insertBefore(imgEl, meta);

    var extMap = { 'jpeg':'JPG','png':'PNG','gif':'GIF','webp':'WebP','svg+xml':'SVG','bmp':'BMP','x-icon':'ICO' };
    badge.textContent = extMap[mime.split('/')[1]] || mime.split('/')[1].toUpperCase();
    badge.classList.add('visible');

    var sizeStr = blob.size < 1048576
      ? Math.round(blob.size / 1024) + ' KB'
      : (blob.size / 1048576).toFixed(1) + ' MB';

    var dimEl = document.getElementById('m-dim');
    if (w && h) {
      dimEl.innerHTML = '<i class="fi fi-rr-compress" aria-hidden="true"></i> ' + w + ' \u00d7 ' + h + 'px';
      dimEl.style.display = '';
    } else { dimEl.style.display = 'none'; }
    document.getElementById('m-type').innerHTML = '<i class="fi fi-rr-file-image" aria-hidden="true"></i> ' + mime;
    document.getElementById('m-size').innerHTML = '<i class="fi fi-rr-disk" aria-hidden="true"></i> ' + sizeStr;
    meta.classList.add('visible');
  }

  /* ── Download ── */
  window.downloadImage = function () {
    if (!_blobUrl || !_mime) return;
    var extMap = { 'jpeg':'jpg','svg+xml':'svg','x-icon':'ico' };
    var ext = extMap[_mime.split('/')[1]] || _mime.split('/')[1];
    var a = document.createElement('a');
    a.href = _blobUrl; a.download = 'converted-image.' + ext;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast('Downloading image\u2026', 'download');
  };

  /* ── Clear ── */
  window.clearConverter = function () {
    var ta = document.getElementById('b64input');
    if (ta) ta.value = '';
    document.getElementById('err-box').classList.remove('visible');
    var blobWrap = document.getElementById('blob-link-wrap');
    if (blobWrap) { blobWrap.innerHTML = ''; blobWrap.style.display = 'none'; }
    revokeBlob(); _mime = null;
    var area = document.getElementById('preview-area');
    var old  = area.querySelector('img');
    if (old) old.remove();
    document.getElementById('preview-ph').style.display = '';
    document.getElementById('img-meta').classList.remove('visible');
    document.getElementById('fmt-badge').classList.remove('visible');
    area.classList.remove('loaded');
    document.getElementById('dl-btn').disabled = true;
  };

  /* ── Keyboard: Ctrl/Cmd+Enter; auto-convert on paste ── */
  document.addEventListener('DOMContentLoaded', function () {
    var ta = document.getElementById('b64input');
    if (!ta) return;
    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); convertB64(); }
    });
    ta.addEventListener('paste', function () { setTimeout(convertB64, 80); });
  });

  window.addEventListener('beforeunload', revokeBlob);
})();
