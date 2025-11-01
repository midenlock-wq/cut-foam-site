// ---- تنظیمات پایه ----
const els = id => document.getElementById(id);
const state = {
  shaConfig: null,
  config: null,
  repoFull: null,
  token: null,
};

function setStatus(msg){ els('status').textContent = msg || ''; }

function loadAuth(){
  const saved = JSON.parse(localStorage.getItem('cf_admin_auth')||'{}');
  if(saved.token) els('token').value = saved.token;
  if(saved.repo) els('repo').value = saved.repo;
}
function saveAuth(){
  const token = els('token').value.trim();
  const repo = els('repo').value.trim();
  if(!token || !repo) return alert('توکن و ریپو را وارد کن');
  localStorage.setItem('cf_admin_auth', JSON.stringify({token, repo}));
  setStatus('ذخیره شد. درحال اتصال…');
  connect();
}
function clearAuth(){
  localStorage.removeItem('cf_admin_auth');
  els('token').value = '';
  els('repo').value = '';
  setStatus('توکن از مرورگر حذف شد.');
}

// ---- GitHub API helpers ----
async function gh(path, method='GET', body){
  const url = `https://api.github.com${path}`;
  const res = await fetch(url, {
    method,
    headers:{
      'Authorization': `token ${state.token}`,
      'Accept':'application/vnd.github+json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if(!res.ok){
    const t = await res.text();
    throw new Error(`GitHub ${res.status}: ${t}`);
  }
  return res.json();
}

async function getFile(path){
  const [owner, repo] = state.repoFull.split('/');
  const data = await gh(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`);
  const content = atob(data.content);
  return {content, sha: data.sha};
}
async function putFile(path, content, message, sha=null){
  const [owner, repo] = state.repoFull.split('/');
  const body = {
    message,
    content: btoa(unescape(encodeURIComponent(content))),
    branch: 'main'
  };
  if(sha) body.sha = sha;
  return gh(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, 'PUT', body);
}
async function putBinary(path, file, message){
  const buf = await file.arrayBuffer();
  const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
  const [owner, repo] = state.repoFull.split('/');
  return gh(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, 'PUT', {
    message, content: b64, branch:'main'
  });
}

// ---- بارگیری و رندر config.json ----
async function connect(){
  try{
    const saved = JSON.parse(localStorage.getItem('cf_admin_auth')||'{}');
    state.token = saved.token || els('token').value.trim();
    state.repoFull = saved.repo || els('repo').value.trim();
    if(!state.token || !state.repoFull) return;

    setStatus('درحال دریافت تنظیمات…');
    const {content, sha} = await getFile('assets/config.json');
    state.shaConfig = sha;
    state.config = JSON.parse(content);

    // پرکردن فرم‌ها
    els('brand').value = state.config.brand || '';
    els('tagline').value = state.config.tagline || '';
    els('instagram').value = state.config.instagram || '';
    els('whatsapp').value = state.config.whatsapp || '';
    els('phone').value = state.config.phone || '';
    els('bannerText').value = state.config.bannerText || '';

    renderGallery();
    renderSections();
    setStatus('متصل شد ✔️');
  }catch(e){
    console.error(e);
    setStatus('اتصال ناموفق: ' + e.message);
  }
}

function renderGallery(){
  const wrap = document.getElementById('gallery');
  wrap.innerHTML = '';
  const items = (state.config?.sections?.gallery?.items)||[];
  for(const it of items){
    const div = document.createElement('div');
    div.className = 'thumb';
    div.innerHTML = `
      <img src="../${it.image}" style="width:100%;height:140px;object-fit:cover;border-radius:8px" />
      <label>عنوان</label><input value="${it.title||''}" data-k="title">
      <label>کپشن</label><input value="${it.caption||''}" data-k="caption">
      <div class="muted" style="margin-top:6px">${it.image}</div>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button class="danger" data-action="del">حذف</button>
      </div>
    `;
    // bind
    div.querySelector('[data-action="del"]').onclick = () => {
      const arr = state.config.sections.gallery.items;
      const idx = arr.indexOf(it);
      if(idx>-1){ arr.splice(idx,1); renderGallery(); }
    };
    for(const inp of div.querySelectorAll('input[data-k]')){
      inp.oninput = () => { it[inp.dataset.k] = inp.value; };
    }
    wrap.appendChild(div);
  }
}

function renderSections(){
  const host = document.getElementById('sections');
  host.innerHTML = '';
  const secs = state.config.sections || {};
  // کارت‌های خدمات نمونه (دو مورد پیش‌فرض)
  const keys = Object.keys(secs).filter(k => k!=='gallery');
  for(const key of keys){
    const s = secs[key];
    const box = document.createElement('div');
    box.className = 'card';
    box.innerHTML = `
      <h3 style="margin:0 0 8px">${s.title||key}</h3>
      <label>عنوان</label><input value="${s.title||''}" data-k="title">
      <label>توضیحات</label><textarea rows="3" data-k="desc">${s.desc||''}</textarea>
      <div class="row">
        <div><label>قیمت</label><input value="${s.price||''}" data-k="price"></div>
        <div><label>واحد</label><input value="${s.unit||''}" data-k="unit"></div>
      </div>
    `;
    for(const el of box.querySelectorAll('[data-k]')){
      el.oninput = () => { s[el.dataset.k] = el.value; };
    }
    host.appendChild(box);
  }
}

// ---- رویدادها ----
document.getElementById('saveAuth').onclick = saveAuth;
document.getElementById('clearAuth').onclick = clearAuth;

document.getElementById('saveBasics').onclick = async () => {
  if(!state.config) return;
  state.config.brand = els('brand').value.trim();
  state.config.tagline = els('tagline').value.trim();
  state.config.instagram = els('instagram').value.trim();
  state.config.whatsapp = els('whatsapp').value.trim();
  state.config.phone = els('phone').value.trim();
  state.config.bannerText = els('bannerText').value.trim();
  await saveConfig('Update basics');
};

document.getElementById('saveSections').onclick = async () => {
  await saveConfig('Update sections');
};

document.getElementById('filePicker').onchange = async e => {
  const files = [...e.target.files];
  if(!files.length) return;
  const items = state.config.sections.gallery.items;

  setStatus('درحال آپلود تصاویر…');
  for(const f of files){
    const ext = f.name.split('.').pop().toLowerCase();
    const name = `img-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `assets/images/${name}`;
    await putBinary(path, f, `Add image ${name}`);
    items.unshift({ title:'', caption:'', image: path }); // بالای لیست
  }
  await saveConfig('Update gallery list (after uploads)');
  renderGallery();
  setStatus('آپلود و به‌روزرسانی انجام شد ✔️');
};

async function saveConfig(message){
  const json = JSON.stringify(state.config, null, 2);
  await putFile('assets/config.json', json, message, state.shaConfig);
  // دریافت sha جدید
  const {sha} = await getFile('assets/config.json');
  state.shaConfig = sha;
  setStatus('ذخیره شد ✔️');
}

// بار اول
loadAuth();
connect();
