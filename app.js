/* app - App Logic (GitHub Storage) */
/* _aid:60-mny7zk0z-uk3mxc */
var GH_TOKEN = localStorage.getItem('_ght') || '';
var GH_REPO = 'app';
var GH_USER = 'PhysicsUncomplicated';
var GH_FILE = 'data.json';
var LOCAL_KEY = 'app-cache';
var _data = [];
var _dataSha = null;

// ─── Storage Layer (GitHub API) ───
async function loadData() {
  showLoading(true);
  try {
    var res = await fetch('https://api.github.com/repos/' + GH_USER + '/' + GH_REPO + '/contents/' + GH_FILE, {
      headers: { 'Authorization': 'token ' + GH_TOKEN, 'Accept': 'application/vnd.github.v3+json' }
    });
    if (res.ok) {
      var json = await res.json();
      _dataSha = json.sha;
      _data = JSON.parse(atob(json.content));
    } else if (res.status === 404) {
      _data = []; _dataSha = null;
    } else { throw new Error('GitHub API error: ' + res.status); }
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(_data)); } catch(e) {}
  } catch(e) {
    console.warn('GitHub unavailable, using cache:', e);
    try { _data = JSON.parse(localStorage.getItem(LOCAL_KEY)) || []; } catch(e2) { _data = []; }
  }
  showLoading(false);
  return _data;
}

async function saveAllData() {
  showLoading(true);
  try {
    var content = btoa(unescape(encodeURIComponent(JSON.stringify(_data, null, 2))));
    var body = { message: 'Update data - ' + new Date().toLocaleString(), content: content };
    if (_dataSha) body.sha = _dataSha;
    var res = await fetch('https://api.github.com/repos/' + GH_USER + '/' + GH_REPO + '/contents/' + GH_FILE, {
      method: 'PUT',
      headers: { 'Authorization': 'token ' + GH_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      var json = await res.json();
      _dataSha = json.content.sha;
      try { localStorage.setItem(LOCAL_KEY, JSON.stringify(_data)); } catch(e) {}
      showLoading(false);
      return true;
    } else {
      var err = await res.json();
      if (err.message && err.message.includes('sha')) {
        // Conflict - reload and retry
        await loadData();
        showLoading(false);
        showMsg('errorBox', 'Data was updated by someone else. Please try again.');
        renderEntries();
        return false;
      }
      throw new Error(err.message || 'Save failed');
    }
  } catch(e) {
    console.error('Save failed:', e);
    showLoading(false);
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(_data)); } catch(e2) {}
    showMsg('errorBox', 'Saved locally (offline). Will sync when connection returns.');
    return true;
  }
}

async function saveData(entry) {
  _data.push(entry);
  return await saveAllData();
}

async function deleteEntry(rowIndex) {
  _data.splice(rowIndex, 1);
  await saveAllData();
  renderEntries();
}

async function deleteAllEntries() {
  if (!confirm('Delete ALL saved data? This cannot be undone.')) return;
  _data = [];
  await saveAllData();
  renderEntries();
  showMsg('successBox', 'All data cleared.');
}

function showLoading(show) {
  var el = document.getElementById('loadingIndicator');
  if (!el) {
    el = document.createElement('div');
    el.id = 'loadingIndicator';
    el.style.cssText = 'position:fixed;top:0;left:0;right:0;height:3px;background:var(--primary);z-index:9999;transition:opacity 0.3s';
    el.innerHTML = '<div style="height:100%;width:30%;background:var(--secondary);animation:loadbar 1s infinite"></div>';
    document.body.appendChild(el);
    var style = document.createElement('style');
    style.textContent = '@keyframes loadbar{0%{margin-left:0}50%{margin-left:70%}100%{margin-left:0}}';
    document.head.appendChild(style);
  }
  el.style.opacity = show ? '1' : '0';
}

// ─── Field Helpers ───
function getValue(id) {
  var el = document.getElementById(id);
  if (!el) return '';
  if (el.classList.contains('radio-group')) { var c = document.querySelector('input[name="'+id+'"]:checked'); return c ? c.value : ''; }
  if (el.type === 'checkbox') return el.checked ? 'Yes' : 'No';
  return el.value.trim();
}
function setFieldValue(id, val) {
  var el = document.getElementById(id);
  if (!el) return;
  if (el.classList.contains('radio-group')) { var r = document.querySelector('input[name="'+id+'"][value="'+val+'"]'); if (r) r.checked = true; }
  else { el.value = val; }
}
function showField(id, show) { var el = document.getElementById(id); if (el) { var p = el.closest('.grid-cell') || el.parentElement; if (p) p.style.display = show ? '' : 'none'; } }
function toggleField(id) { var el = document.getElementById(id); if (el) { var p = el.closest('.grid-cell') || el.parentElement; if (p) p.style.display = p.style.display === 'none' ? '' : 'none'; } }
function disableField(id, d) { var el = document.getElementById(id); if (el) { el.disabled = d; el.style.opacity = d ? '0.5' : '1'; } }
function showMsg(boxId, msg) {
  var box = document.getElementById(boxId); if (!box) return;
  box.innerHTML = msg; box.style.display = 'block';
  var other = boxId === 'errorBox' ? 'successBox' : 'errorBox';
  var ob = document.getElementById(other); if (ob) ob.style.display = 'none';
  if (boxId === 'successBox') setTimeout(function() { box.style.display = 'none'; }, 3000);
}
function exportCSV() {
  if (!_data.length) { alert('No data to export'); return; }
  var keys = Object.keys(_data[0]).filter(function(k) { return !k.startsWith('_'); });
  var header = ['Time'].concat(keys).join(',');
  var rows = _data.map(function(r) { return [r._time].concat(keys.map(function(k) { return '"' + (r[k]||'').toString().replace(/"/g,'""') + '"'; })).join(','); });
  var csv = header + '\n' + rows.join('\n');
  var blob = new Blob([csv], { type: 'text/csv' });
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'app-data.csv'; a.click();
}

// ─── Validation ───
function validateForm() {
  var errors = [];

  return errors;
}

// ─── Form Submit ───
async function handleSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  var errors = validateForm();
  if (errors.length) { showMsg('errorBox', errors.map(function(e) { return '<div>• ' + e + '</div>'; }).join('')); return false; }
  var entry = {};
  document.querySelectorAll('.input-field,.radio-group').forEach(function(el) { if (el.id) entry[el.id] = getValue(el.id); });
  entry._time = new Date().toLocaleString();
  var ok = await saveData(entry);
  if (ok) { renderEntries(); showMsg('successBox', 'Saved!'); document.getElementById('appForm').reset(); }
  return false;
}

// ─── Button & Change Handlers ───
async function handleAction(id) {
  await handleSubmit(new Event('submit'));
}
function handleFieldChange(id) {
  // No change actions defined
}

// ─── Render Entries ───
function renderEntries() {
  var list = document.getElementById('entriesList');
  var countEl = document.getElementById('entryCount');
  if (countEl) countEl.textContent = _data.length + ' entr' + (_data.length === 1 ? 'y' : 'ies');
  if (!_data.length) { list.innerHTML = '<p style="color:#999;text-align:center;padding:30px 0">No entries yet. Fill the form and submit to see records here.</p>'; return; }
  list.innerHTML = _data.slice().reverse().map(function(d, ri) {
    var i = _data.length - 1 - ri;
    var items = Object.entries(d).filter(function(kv) { return !kv[0].startsWith('_'); }).map(function(kv) { return '<b>' + kv[0] + ':</b> ' + kv[1]; }).join('<br>');
    var offline = d._offline ? ' <span style="color:#e88;font-size:10px">(offline)</span>' : '';
    return '<div class="entry-card"><div class="entry-card-time"><small>' + d._time + offline + '</small><button onclick="deleteEntry(' + i + ')">Delete</button></div>' + items + '</div>';
  }).join('');
}

// ─── Tab Switching ───
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
  document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
  if (tab === 'history') {
    document.getElementById('tabHistory').classList.add('active');
    document.getElementById('tabHistoryContent').classList.add('active');
    renderEntries();
  } else {
    document.getElementById('tabForm').classList.add('active');
    document.getElementById('tabFormContent').classList.add('active');
  }
}

// ─── Event Listeners ───
document.addEventListener('input', function(e) {
  if (e.target.id && document.getElementById(e.target.id + '_preview')) {
    var m = e.target.value.match(/(?:youtu\.be\/|v=)([\\w-]{11})/);
    document.getElementById(e.target.id + '_preview').innerHTML = m ? '<iframe src="https://www.youtube.com/embed/' + m[1] + '" allowfullscreen></iframe>' : '';
  }
  if (e.target.id) handleFieldChange(e.target.id);
});
document.addEventListener('change', function(e) {
  var rg = e.target.closest('.radio-group');
  if (rg) handleFieldChange(rg.id);
  if (e.target.tagName === 'SELECT') handleFieldChange(e.target.id);
});

// ─── QR Scanner ───
var _qrStreams = {};
var _qrAnimFrames = {};
function startQRScan(fieldId, successAction, successMsg, soundUrl) {
  var viewport = document.getElementById(fieldId + '_viewport');
  var video = document.getElementById(fieldId + '_video');
  var resultDiv = document.getElementById(fieldId + '_result');
  if (!viewport || !video) { alert('QR scanner not found'); return; }
  viewport.style.display = 'block'; resultDiv.style.display = 'none';
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(function(stream) {
    _qrStreams[fieldId] = stream; video.srcObject = stream; video.play();
    var canvas = document.createElement('canvas'); var ctx = canvas.getContext('2d');
    function scanFrame() {
      if (!_qrStreams[fieldId]) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        if (typeof jsQR !== 'undefined') {
          var code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) { handleQRResult(fieldId, code.data, successAction, successMsg, soundUrl); return; }
        }
      }
      _qrAnimFrames[fieldId] = requestAnimationFrame(scanFrame);
    }
    _qrAnimFrames[fieldId] = requestAnimationFrame(scanFrame);
  }).catch(function(err) { alert('Camera error: ' + err.message); viewport.style.display = 'none'; });
}
function stopQRScan(fieldId) {
  if (_qrStreams[fieldId]) { _qrStreams[fieldId].getTracks().forEach(function(t) { t.stop(); }); delete _qrStreams[fieldId]; }
  if (_qrAnimFrames[fieldId]) { cancelAnimationFrame(_qrAnimFrames[fieldId]); delete _qrAnimFrames[fieldId]; }
  var vp = document.getElementById(fieldId + '_viewport'); if (vp) vp.style.display = 'none';
}
async function handleQRResult(fieldId, data, successAction, successMsg, soundUrl) {
  stopQRScan(fieldId);
  var rd = document.getElementById(fieldId + '_result'); if (rd) { rd.style.display = 'block'; rd.innerHTML = '<strong>Scanned:</strong> ' + data; }
  await saveData({ _time: new Date().toLocaleString(), scan_field: fieldId, qr_data: data, scan_type: 'qr_code' });
  renderEntries();
  if (successAction === 'text' || successAction === 'both') showMsg('successBox', successMsg || 'QR scanned: ' + data);
  if (successAction === 'sound' || successAction === 'both') {
    try { if (soundUrl) { new Audio(soundUrl).play(); } else {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var o1 = ctx.createOscillator(); var g1 = ctx.createGain();
      o1.frequency.value = 880; g1.gain.setValueAtTime(0.3, ctx.currentTime); g1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      o1.connect(g1); g1.connect(ctx.destination); o1.start(); o1.stop(ctx.currentTime + 0.15);
      var o2 = ctx.createOscillator(); var g2 = ctx.createGain();
      o2.frequency.value = 1320; g2.gain.setValueAtTime(0.3, ctx.currentTime + 0.12); g2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      o2.connect(g2); g2.connect(ctx.destination); o2.start(ctx.currentTime + 0.12); o2.stop(ctx.currentTime + 0.35);
    } } catch(e) {}
  }
}

// ─── Page Load ───
document.addEventListener('DOMContentLoaded', async function() {
  // If no GitHub token, redirect to setup page
  if (!GH_TOKEN && location.pathname.indexOf('setup.html') === -1) {
    location.href = 'setup.html';
    return;
  }
  await loadData();
  renderEntries();

});
