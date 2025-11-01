// admin/admin.js
document.addEventListener('DOMContentLoaded', () => {
  const el = id => document.getElementById(id);

  // عناصر
  const ghToken = el('ghToken');
  const owner   = el('owner');
  const repo    = el('repo');
  const branch  = el('branch');
  const status  = el('status');
  const loadBtn = el('loadData');
  const saveBtn = el('saveCreds');
  const grid    = el('grid');

  const newTitle    = el('newTitle');
  const newPrice    = el('newPrice');
  const newCategory = el('newCategory');
  const newDesc     = el('newDesc');
  const newFile     = el('newFile');
  const addItemBtn  = el('addItem');

  // بارگذاری از localStorage (فقط روی دستگاه خودت)
  const readLS = k => localStorage.getItem(k) || '';
  ghToken.value = ''; // توکن را برای امنیت، نمایش ندهیم
  owner.value   = readLS('cf_owner');
  repo.value    = readLS('cf_repo');
  branch.value  = readLS('cf_branch') || 'main';

  saveBtn.onclick = () => {
    // هشدار: نگهداری توکن در localStorage امن نیست؛ فعلاً برای تست نذاریم
    // localStorage.setItem('cf_token', ghToken.value);
    localStorage.setItem('cf_owner', owner.value.trim());
    localStorage.setItem('cf_repo', repo.value.trim());
    localStorage.setItem('cf_branch', branch.value.trim());
    status.textContent = 'ذخیره شد.';
    setTimeout(()=> status.textContent = '', 2000);
  };

  loadBtn.onclick = async () => {
    status.textContent = 'در حال خواندن داده‌ها...';
    grid.innerHTML = '';
    try {
      // چون داخل پوشه admin هستیم، مسیر کانفیگ نسبی است
      const resp = await fetch('../assets/config.json', { cache: 'no-cache' });
      const data = await resp.json();
      renderItems(data);
      status.textContent = 'آماده.';
    } catch (e) {
      console.error(e);
      status.textContent = 'خطا در خواندن config.json';
    }
  };

  function renderItems(data){
    const items = data.items || data.gallery || data.works || [];
    if (!items.length){
      grid.innerHTML = '<p style="opacity:.7">موردی پیدا نشد. config.json را بررسی کنید.</p>';
      return;
    }
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fill,minmax(220px,1fr))';
    grid.style.gap = '12px';

    items.forEach((it, idx) => {
      const card = document.createElement('div');
      card.className = 'card';
      const imgSrc = it.src || it.image || it.url || it.path || '';
      const title  = it.title || it.caption || it.name || `مورد ${idx+1}`;
      const price  = it.price ? ` | قیمت: ${it.price}` : '';
      const cat    = it.category ? ` (${it.category})` : '';

      card.innerHTML = `
        <div style="display:flex;gap:12px;align-items:flex-start">
          <img class="thumb" src="${imgSrc}" alt="">
          <div style="flex:1">
            <div style="font-weight:bold">${title}${cat}${price}</div>
            <div style="opacity:.8;font-size:.9rem">${it.desc || it.description || ''}</div>
            <div class="toolbar" style="margin-top:8px">
              <button data-idx="${idx}" class="btn-edit">ویرایش</button>
              <button data-idx="${idx}" class="btn-del">حذف</button>
            </div>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    // هنوز حذف/ویرایش را به گیت‌هاب نمی‌فرستیم (برای امنیت)، فقط هشدار می‌دهیم
    grid.addEventListener('click', e => {
      const btn = e.target.closest('button');
      if(!btn) return;
      if (btn.classList.contains('btn-edit')) {
        alert('ویرایش آیتم: این بخش به سرور/اکشن امن متصل می‌شود (توکن در کلاینت استفاده نخواهد شد).');
      }
      if (btn.classList.contains('btn-del')) {
        alert('حذف آیتم: این بخش به سرور/اکشن امن متصل می‌شود (توکن در کلاینت استفاده نخواهد شد).');
      }
    }, { once:true });
  }

  addItemBtn.onclick = () => {
    // مرحله‌ی بعد: ارسال به سرور امن/اکشن گیت‌هاب
    if(!newFile.files[0]){
      alert('لطفاً تصویر را انتخاب کنید.');
      return;
    }
    alert('افزودن مورد جدید: در نسخهٔ امن، فایل به سرور ارسال و سپس commit می‌شود.');
  };
});
