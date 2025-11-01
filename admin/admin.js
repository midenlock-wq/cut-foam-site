<script>
// --- تنظیمات پیشفرض (می‌تونی در فرم هم عوض کنی)
const DEFAULTS = {
  owner: "midenlock-wq",
  repo:  "cut-foam-site",
  branch:"main"
};

// ابزارک‌های صفحه
const $ = (sel)=>document.querySelector(sel);
const statusEl = ()=> $("#status");

// ذخیره/خواندن از localStorage
function saveCreds(tok, owner, repo, branch){
  if(tok)   localStorage.setItem("gh_token", tok.trim());
  if(owner) localStorage.setItem("gh_owner", owner.trim());
  if(repo)  localStorage.setItem("gh_repo",  repo.trim());
  if(branch)localStorage.setItem("gh_branch",branch.trim());
}
function loadCreds(){
  $("#ghToken").value = localStorage.getItem("gh_token") || "";
  $("#owner").value   = localStorage.getItem("gh_owner") || DEFAULTS.owner;
  $("#repo").value    = localStorage.getItem("gh_repo")  || DEFAULTS.repo;
  $("#branch").value  = localStorage.getItem("gh_branch")|| DEFAULTS.branch;
}

// پیام وضعیت
function setStatus(txt, ok=false){
  statusEl().textContent = txt;
  statusEl().style.color = ok? "#22c55e" : "#eab308";
  console.log("[ADMIN]", txt);
}

// فراخوانی API گیت‌هاب (PUT /contents)
async function githubPutContent({path, message, contentBase64}) {
  const token  = $("#ghToken").value || localStorage.getItem("gh_token");
  const owner  = $("#owner").value.trim();
  const repo   = $("#repo").value.trim();
  const branch = $("#branch").value.trim();

  if(!token)  throw new Error("توکن خالی است.");
  if(!owner || !repo || !branch) throw new Error("owner/repo/branch خالی است.");

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`;
  const body = { message, content: contentBase64, branch };

  const res  = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `token ${token}`,
      "Accept": "application/vnd.github+json"
    },
    body: JSON.stringify(body)
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }

  if(!res.ok){
    console.error("GitHub error:", data);
    throw new Error(`خطای گیت‌هاب (${res.status}): ${typeof data==='string'?data:(data?.message||'نامشخص')}`);
  }
  return data;
}

// خواندن فایل به base64 (بدون پیشوند data:)
function fileToBase64(file){
  return new Promise((resolve, reject)=>{
    const fr = new FileReader();
    fr.onerror = reject;
    fr.onload = () => {
      const base64 = fr.result.split(",")[1];
      resolve(base64);
    };
    fr.readAsDataURL(file);
  });
}

// بارگذاری لیست (فقط تست ارتباط)
async function testList(){
  try{
    const owner  = $("#owner").value.trim();
    const repo   = $("#repo").value.trim();
    const branch = $("#branch").value.trim();
    const token  = $("#ghToken").value || localStorage.getItem("gh_token");

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/assets?ref=${branch}`;
    const res = await fetch(url, {
      headers: token ? {"Authorization": `token ${token}`} : {}
    });
    if(res.status===404){
      setStatus("پوشه assets هنوز ساخته نشده (مشکلی نیست).", false);
      return;
    }
    const json = await res.json();
    console.log("assets listing:", json);
    setStatus("ارتباط برقرار است ✅", true);
  }catch(e){
    console.error(e);
    setStatus("عدم دسترسی/فهرست‌گیری: "+ e.message, false);
  }
}

// افزودن نمونه‌کار (آپلود تصویر)
async function addItem(){
  try{
    const file = $("#newFile").files?.[0];
    const title = $("#newTitle").value.trim() || "نمونه‌کار بدون عنوان";
    if(!file){ alert("فایل تصویر را انتخاب کنید."); return; }

    setStatus("در حال خواندن فایل...", false);
    const b64 = await fileToBase64(file);

    // مسیر ذخیره: assets/gallery/yyyymmdd-HHMMSS-نام‌فایل
    const ts   = new Date();
    const stamp= ts.toISOString().replace(/[-:T.Z]/g,"").slice(0,14);
    const safe = file.name.replace(/\s+/g,"_");
    const path = `assets/gallery/${stamp}-${safe}`;

    setStatus("در حال ارسال به GitHub ...", false);
    const resp = await githubPutContent({
      path,
      message: `Add gallery item: ${title}`,
      contentBase64: b64
    });

    console.log("PUT result:", resp);
    setStatus("آپلود موفق بود ✅", true);
    alert("آپلود شد: " + (resp?.content?.path || path));
    $("#newFile").value = "";
  }catch(err){
    console.error(err);
    alert("خطا: " + err.message);
    setStatus("خطا: " + err.message, false);
  }
}

// رویدادها
window.addEventListener("DOMContentLoaded", ()=>{
  loadCreds();
  $("#saveCreds").addEventListener("click", ()=>{
    saveCreds($("#ghToken").value, $("#owner").value, $("#repo").value, $("#branch").value);
    setStatus("ذخیره شد.", true);
  });
  $("#loadData").addEventListener("click", testList);
  $("#addItem").addEventListener("click", addItem);
});
</script>
