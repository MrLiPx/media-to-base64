/* ================================================================
   encoder.js — Image → Base64 converter logic
   - Drag/drop, file picker, clipboard paste
   - URL import via UI input or ?import=<url> query param
   - CORS fallback via allorigins.win proxy
   ================================================================ */
(function () {
  'use strict';

  var _dataUrl = null;
  var _blobUrl = null;
  var _fmt     = 'dataurl';

  var PROXY = 'https://api.allorigins.win/raw?url=';

  /* ── DOMContentLoaded ── */
  document.addEventListener('DOMContentLoaded', function () {
    setupDropzone();
    setupUrlImport();
    checkImportParam();
  });

  /* ── Dropzone ── */
  function setupDropzone() {
    var dz = document.getElementById('dropzone');
    if (!dz) return;

    dz.addEventListener('dragenter', function (e) { e.preventDefault(); dz.classList.add('drag-over'); });
    dz.addEventListener('dragover',  function (e) { e.preventDefault(); dz.classList.add('drag-over'); });
    dz.addEventListener('dragleave', function (e) {
      if (!dz.contains(e.relatedTarget)) dz.classList.remove('drag-over');
    });
    dz.addEventListener('drop', function (e) {
      e.preventDefault(); dz.classList.remove('drag-over');
      var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) handleFile(file);
      else showToast('Please drop an image file', 'error');
    });
    dz.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        document.getElementById('file-input').click();
      }
    });

    document.addEventListener('paste', function (e) {
      var items = (e.clipboardData || (e.originalEvent && e.originalEvent.clipboardData) || {}).items || [];
      for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          handleFile(items[i].getAsFile()); break;
        }
      }
    });
  }

  /* ── URL import UI ── */
  function setupUrlImport() {
    var btn   = document.getElementById('url-import-btn');
    var input = document.getElementById('url-import-input');
    if (!btn || !input) return;

    btn.addEventListener('click', function () {
      triggerUrlImport(input.value.trim());
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); triggerUrlImport(input.value.trim()); }
    });

    /* Show/hide the URL import row */
    var toggle = document.getElementById('url-import-toggle');
    var row    = document.getElementById('url-import-row');
    if (toggle && row) {
      toggle.addEventListener('click', function () {
        var open = row.style.display !== 'none';
        row.style.display = open ? 'none' : '';
        toggle.setAttribute('aria-expanded', String(!open));
        if (!open) input.focus();
      });
    }
  }

  /* ── Fetch image from URL with CORS fallback ── */
  function triggerUrlImport(url) {
    if (!url) { showToast('Paste an image URL first', 'error'); return; }

    /* Basic URL validation */
    try { new URL(url); } catch (e) {
      showToast('Invalid URL \u2014 make sure it starts with https://', 'error');
      return;
    }

    setUrlImportLoading(true);
    showToast('Fetching image\u2026', 'info');

    fetchWithFallback(url)
      .then(function (blob) {
        if (!blob.type.startsWith('image/')) {
          /* Try to guess from URL extension */
          var ext = url.split('.').pop().toLowerCase().split('?')[0];
          var mimeMap = { jpg:'image/jpeg', jpeg:'image/jpeg', png:'image/png',
                          gif:'image/gif', webp:'image/webp', svg:'image/svg+xml',
                          bmp:'image/bmp', ico:'image/x-icon' };
          var guessed = mimeMap[ext] || 'image/png';
          blob = blob.slice(0, blob.size, guessed);
        }
        if (!blob.type.startsWith('image/')) {
          throw new Error('URL does not appear to be an image');
        }
        var filename = url.split('/').pop().split('?')[0] || 'imported-image';
        var file = new File([blob], filename, { type: blob.type });
        handleFile(file);

        /* Clear the input after success */
        var input = document.getElementById('url-import-input');
        if (input) input.value = '';
      })
      .catch(function (err) {
        showToast('Import failed: ' + err.message, 'error');
        setUrlImportLoading(false);
      });
  }

  /* Try direct fetch first, fall back to allorigins proxy on CORS/network error */
  function fetchWithFallback(url) {
    return fetch(url, { mode: 'cors' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.blob();
      })
      .catch(function () {
        /* CORS blocked or network error — try the proxy */
        return fetch(PROXY + encodeURIComponent(url))
          .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status + ' (via proxy)');
            return res.blob();
          });
      });
  }

  function setUrlImportLoading(on) {
    var btn = document.getElementById('url-import-btn');
    if (!btn) return;
    btn.disabled = on;
    btn.innerHTML = on
      ? '<i class="fi fi-rr-spinner" aria-hidden="true"></i> Loading\u2026'
      : '<i class="fi fi-rr-download" aria-hidden="true"></i> Import';
  }

  /* ── Auto-import from ?import= query param ── */
  function checkImportParam() {
    var params    = new URLSearchParams(window.location.search);
    var importUrl = params.get('import');
    if (!importUrl) return;

    /* Strip ?import= from the address bar immediately — clean URL, no reload */
    try {
      history.replaceState(null, '', window.location.pathname + window.location.hash);
    } catch (e) { /* ignore in sandboxed environments */ }

    /* Populate the input with the URL so the user can see what was imported */
    var input = document.getElementById('url-import-input');
    if (input) input.value = importUrl;

    /* Open the URL import row so it's visible */
    var row = document.getElementById('url-import-row');
    if (row) row.style.display = '';
    var toggle = document.getElementById('url-import-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');

    triggerUrlImport(importUrl);
  }

  /* ── Handle file ── */
  function handleFile(file) {
    if (!file) return;
    setUrlImportLoading(false);

    if (!file.type.startsWith('image/')) {
      showToast('Not an image \u2014 only PNG, JPEG, GIF, WebP, SVG, BMP, ICO are supported', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('File too large \u2014 max 10 MB', 'error'); return;
    }

    if (_blobUrl) { URL.revokeObjectURL(_blobUrl); _blobUrl = null; }
    _blobUrl = URL.createObjectURL(file);

    var thumb = document.getElementById('dz-thumb');
    thumb.src          = _blobUrl;
    thumb.style.display = 'block';
    thumb.style.cursor  = 'pointer';
    thumb.title         = 'Click to open in new tab';
    thumb.onclick = function () { window.open(_blobUrl, '_blank', 'noopener,noreferrer'); };

    renderBlobLink(_blobUrl);

    var dzTitle = document.querySelector('.dz-title');
    if (dzTitle) dzTitle.textContent = file.name;

    var reader = new FileReader();
    reader.onload = function (e) {
      _dataUrl = e.target.result;
      document.getElementById('copy-btn').disabled  = false;
      document.getElementById('clear-btn').disabled = false;
      renderOutput();
      var sizeStr = file.size < 1048576
        ? Math.round(file.size / 1024) + ' KB'
        : (file.size / 1048576).toFixed(1) + ' MB';
      showToast('Image loaded \u2014 ' + sizeStr, 'success');
    };
    reader.onerror = function () { showToast('Failed to read the image file', 'error'); };
    reader.readAsDataURL(file);
  }

  window.handleFile = function (file) { handleFile(file); };

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

  /* ── Format toggle ── */
  window.setFmt = function (val) {
    _fmt = val;
    document.querySelectorAll('.fmt-toggle label').forEach(function (l) {
      l.classList.toggle('active', l.dataset.val === val);
    });
    renderOutput();
  };

  /* ── Render output textarea ── */
  function renderOutput() {
    if (!_dataUrl) return;
    var out = _fmt === 'raw' && _dataUrl.includes(',')
      ? _dataUrl.split(',')[1] : _dataUrl;
    document.getElementById('b64output').value = out;
    var len = out.length;
    document.getElementById('char-count').textContent =
      len.toLocaleString() + ' characters (\u2248' +
      Math.round(len * 0.75 / 1024).toLocaleString() + ' KB decoded)';
  }

  /* ── Copy ── */
  window.copyOutput = function () {
    var val = document.getElementById('b64output').value;
    if (!val) { showToast('Nothing to copy', 'error'); return; }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(val)
        .then(function () { showToast('Copied to clipboard', 'success'); })
        .catch(fallbackCopy);
    } else { fallbackCopy(); }
  };
  function fallbackCopy() {
    var ta = document.getElementById('b64output');
    ta.select(); ta.setSelectionRange(0, ta.value.length);
    try { document.execCommand('copy'); showToast('Copied to clipboard', 'success'); }
    catch (e) { showToast('Copy failed \u2014 select and copy manually', 'error'); }
  }

  /* ── Clear ── */
  window.clearUploader = function () {
    _dataUrl = null; _fmt = 'dataurl';
    if (_blobUrl) { URL.revokeObjectURL(_blobUrl); _blobUrl = null; }
    var fi = document.getElementById('file-input');
    if (fi) fi.value = '';
    var thumb = document.getElementById('dz-thumb');
    thumb.style.display = 'none'; thumb.src = ''; thumb.onclick = null;
    var blobWrap = document.getElementById('blob-link-wrap');
    if (blobWrap) { blobWrap.innerHTML = ''; blobWrap.style.display = 'none'; }
    document.getElementById('b64output').value        = '';
    document.getElementById('char-count').textContent = '';
    var dzTitle = document.querySelector('.dz-title');
    if (dzTitle) dzTitle.innerHTML = 'Drop image here, or <span class="dz-link">click to browse</span>';
    document.getElementById('copy-btn').disabled  = true;
    document.getElementById('clear-btn').disabled = true;
    document.querySelectorAll('.fmt-toggle label').forEach(function (l) {
      l.classList.toggle('active', l.dataset.val === 'dataurl');
    });
    setUrlImportLoading(false);
  };

  window.addEventListener('beforeunload', function () {
    if (_blobUrl) URL.revokeObjectURL(_blobUrl);
  });
})();
