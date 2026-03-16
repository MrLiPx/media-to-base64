/* ================================================================
   encoder.js — Image → Base64 converter logic
   Supports ?import=<url> query param to auto-load an image from URL.
   Preview uses a regular <img> tag with blob: URL src.
   ================================================================ */
(function () {
  'use strict';

  var _dataUrl = null;
  var _blobUrl = null;
  var _fmt     = 'dataurl';

  /* ── Drop zone setup ── */
  document.addEventListener('DOMContentLoaded', function () {
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

    /* Paste image from clipboard */
    document.addEventListener('paste', function (e) {
      var items = (e.clipboardData || (e.originalEvent && e.originalEvent.clipboardData) || {}).items || [];
      for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          handleFile(items[i].getAsFile()); break;
        }
      }
    });

    /* ── Handle ?import=<url> query parameter ── */
    checkImportParam();
  });

  /* ── Auto-import from ?import= URL param ── */
  function checkImportParam() {
    var params = new URLSearchParams(window.location.search);
    var importUrl = params.get('import');
    if (!importUrl) return;

    /* Remove ?import= from the address bar immediately — clean URL */
    try {
      var clean = window.location.pathname + window.location.hash;
      history.replaceState(null, '', clean);
    } catch (e) { /* ignore */ }

    showToast('Loading image from URL\u2026', 'info');

    fetch(importUrl)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.blob();
      })
      .then(function (blob) {
        /* Treat the fetched blob as if it were a dropped file */
        var mime = blob.type || 'image/png';
        var filename = importUrl.split('/').pop().split('?')[0] || 'imported-image';
        var file = new File([blob], filename, { type: mime });
        handleFile(file);
      })
      .catch(function (err) {
        showToast('Could not load image: ' + err.message, 'error');
      });
  }

  /* ── Handle file (from drop, click, paste, or URL import) ── */
  function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error'); return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('File too large \u2014 max 10 MB', 'error'); return;
    }

    /* Revoke previous blob URL */
    if (_blobUrl) { URL.revokeObjectURL(_blobUrl); _blobUrl = null; }

    /* Create blob: URL — used for the <img> src, instant render */
    _blobUrl = URL.createObjectURL(file);

    /* Show <img> preview immediately using blob: URL */
    var thumb = document.getElementById('dz-thumb');
    thumb.src   = _blobUrl;
    thumb.style.display = 'block';
    thumb.style.cursor  = 'pointer';
    thumb.title = 'Click to open in new tab';
    thumb.onclick = function () {
      window.open(_blobUrl, '_blank', 'noopener,noreferrer');
    };

    renderBlobLink(_blobUrl);

    var dzTitle = document.querySelector('.dz-title');
    if (dzTitle) dzTitle.textContent = file.name;

    /* FileReader runs in background to produce the base64 output */
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
    reader.onerror = function () { showToast('Failed to read file', 'error'); };
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
    var ta = document.getElementById('b64output');
    ta.value = out;
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
  };

  window.addEventListener('beforeunload', function () {
    if (_blobUrl) URL.revokeObjectURL(_blobUrl);
  });
})();
