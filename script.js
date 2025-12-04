// script.js - main site logic: grid, story page, rating, comments, profile, export/import

// Utilities
function qs(sel){ return document.querySelector(sel); }
function qsa(sel){ return Array.from(document.querySelectorAll(sel)); }
function saveStoriesToLocal(){ localStorage.setItem('stories', JSON.stringify(stories)); }
function loadStoriesFromLocal(){ try{ const s = JSON.parse(localStorage.getItem('stories')||'[]'); return s;}catch(e){return [];} }

let userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');

// COMMON: theme, color, notices
document.addEventListener('DOMContentLoaded', ()=>{
  // theme toggle
  const themeSwitch = qs('#themeSwitch');
  if(themeSwitch) themeSwitch.addEventListener('click', ()=> document.body.classList.toggle('dark'));

  const colorSelect = qs('#colorSchemeSelect');
  if(colorSelect) colorSelect.addEventListener('change', ()=>{
    const val = colorSelect.value;
    document.documentElement.className = '';
    if(val!=='default') document.documentElement.classList.add('theme-'+val);
  });

  // Notice display
  const noticeText = localStorage.getItem('siteNoticeText') || '';
  if(qs('#noticeTextDisplay')) qs('#noticeTextDisplay').innerText = (noticeText || 'Stories are saved locally.');
  if(qs('#noticeAdminPanel')){
    // show admin panel only if logged in as admin
    const current = localStorage.getItem('currentUser');
    if(current) qs('#noticeAdminPanel').classList.remove('hidden');
    qs('#addNoticeBtn').addEventListener('click', ()=>{
      const txt = qs('#noticeText').value.trim();
      const color = qs('#noticeColor').value;
      localStorage.setItem('siteNoticeText', txt);
      localStorage.setItem('siteNoticeColor', color);
      qs('#noticeTextDisplay').innerText = txt;
      alert('Notice updated (local)');
    });
  }

  // Export/Import handlers
  if(qs('#exportBtn')) qs('#exportBtn').addEventListener('click', exportAllAsZip);
  if(qs('#importBtn')) qs('#importBtn').addEventListener('click', ()=> qs('#importFile').click());
  if(qs('#importFile')) qs('#importFile').addEventListener('change', handleImportFile);

  renderStoriesGrid();
  attachRandomButton();
});

function renderStoriesGrid(){
  const grid = qs('#storiesGrid');
  if(!grid) return;
  const sList = loadStoriesFromLocal();
  grid.innerHTML='';
  sList.forEach(st=>{
    const div = document.createElement('div');
    div.className='story-card';
    div.innerHTML = `
      <img src="${st.img||''}" alt="${st.title}">
      <div class="meta"><h3>${st.title}</h3><p class="small">${st.description||''}</p>
      <div class="btn-group">
        <button class="btn" onclick="openStoryPage(${st.id})">Open</button>
        <button class="btn" onclick="openChapterIndex(${st.id})">Chapters</button>
      </div></div>
    `;
    grid.appendChild(div);
  });
}

function attachRandomButton(){
  const btn = qs('#randomStoryBtn');
  if(!btn) return;
  btn.addEventListener('click', ()=>{
    const s = loadStoriesFromLocal();
    if(!s.length) return;
    const idx = Math.floor(Math.random()*s.length);
    openStoryPage(s[idx].id);
  });
}

// Open story page (story.html?id=...)
function openStoryPage(storyId){
  window.location.href = `story.html?id=${storyId}`;
}

// Open chapter index popup in new window (simple)
function openChapterIndex(storyId){
  const s = loadStoriesFromLocal().find(x=>x.id===storyId);
  if(!s) return alert('Story not found');
  const w = window.open('', '_blank');
  let html = `<html><head><title>${s.title} — Chapters</title><link rel="stylesheet" href="styles.css"></head><body>`;
  html += `<h1>${s.title} — Chapters</h1><ul>`;
  s.chapters.forEach(c=> html+=`<li><a href="#" onclick="window.opener.openStoryChapter(${storyId},${c.id});window.close();">${c.title}</a></li>`);
  html += `</ul></body></html>`;
  w.document.write(html);
}

// STORY PAGE logic (runs on story.html)
(function(){
  if(!qs('#storyContent')) return;
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'));
  const s = loadStoriesFromLocal().find(x=>x.id===id);
  if(!s) { qs('#storyContent').innerText = 'Story not found'; return; }
  // increase view count
  s.views = (s.views||0)+1; saveStoriesToLocal();
  qs('#storyTitleEl').innerText = s.title;
  // meta
  if(qs('#storyMeta')) qs('#storyMeta').innerHTML = `<img src="${s.img||''}" style="max-width:200px;float:left;margin-right:12px"><p><strong>${s.title}</strong><br>${s.description||''}<br>Views: ${s.views}</p><div style="clear:both"></div>`;
  // chapters
  if(s.chapters && s.chapters.length){
    const nav = qs('#chapterNav'); nav.classList.remove('hidden'); nav.innerHTML = s.chapters.map(c=>`<button class="btn small-link" onclick="openStoryChapter(${id},${c.id})">${c.title}</button>`).join(' ');
    // load first chapter by default
    openStoryChapter(id, s.chapters[0].id);
  } else {
    qs('#storyContent').innerHTML = s.content || '<p>No content</p>';
  }
  // rating widget
  renderRatingWidget(id);
  // comments
  renderComments(id);
})();

// open specific chapter and render
function openStoryChapter(storyId, chapterId){
  const s = loadStoriesFromLocal().find(x=>x.id===storyId);
  if(!s) return;
  const ch = s.chapters.find(c=>c.id===chapterId);
  if(!ch) return;
  qs('#storyContent').innerHTML = ch.content;
}

// Rating widget functions
function renderRatingWidget(storyId){
  const starsBox = qs('#starsWidget');
  if(!starsBox) return;
  starsBox.innerHTML='';
  for(let i=1;i<=5;i++){
    const sp = document.createElement('span');
    sp.className='star';
    sp.dataset.value = i;
    sp.innerHTML = '☆';
    sp.addEventListener('click', ()=> setRating(storyId, i));
    sp.addEventListener('mouseover', ()=> highlightStars(i));
    sp.addEventListener('mouseout', ()=> highlightStars(0));
    starsBox.appendChild(sp);
  }
  updateAvgRatingDisplay(storyId);
}

function highlightStars(n){
  qsa('.star').forEach(s=> s.innerHTML = (s.dataset.value<=n ? '★' : '☆'));
}

function setRating(storyId, value){
  const s = loadStoriesFromLocal().find(x=>x.id===storyId);
  if(!s) return;
  s.ratings = s.ratings||[];
  s.ratings.push(value);
  saveStoriesToLocal();
  updateAvgRatingDisplay(storyId);
  qs('#rating-result').innerText = 'Your rating: ' + value;
}

function updateAvgRatingDisplay(storyId){
  const s = loadStoriesFromLocal().find(x=>x.id===storyId);
  if(!s) return;
  const avg = s.ratings && s.ratings.length ? (s.ratings.reduce((a,b)=>a+b,0)/s.ratings.length).toFixed(2) : '—';
  if(qs('#avgRatingText')) qs('#avgRatingText').innerText = 'Average: ' + avg + ' ★';
  // set stars to display average where possible
  qsa('.star').forEach(sp=> sp.innerHTML = (sp.dataset.value <= Math.round(avg) ? '★' : '☆'));
}

// Comments functions
function renderComments(storyId){
  const s = loadStoriesFromLocal().find(x=>x.id===storyId);
  if(!s) return;
  const list = qs('#commentsList');
  list.innerHTML='';
  (s.comments||[]).forEach(c=>{
    const li = document.createElement('li');
    li.className='comment';
    li.innerHTML = `<strong>${c.author||'Anon'}</strong> <small class="small">${new Date(c.ts).toLocaleString()}</small><div>${c.text}</div>`;
    list.appendChild(li);
  });
  const form = qs('#commentForm');
  if(form){ form.onsubmit = (e)=>{ e.preventDefault(); const t = qs('#commentText').value.trim(); const a = qs('#commentAuthor').value.trim(); if(!t) return; s.comments = s.comments||[]; s.comments.push({author:a,text:t,ts:Date.now()}); saveStoriesToLocal(); renderComments(storyId); form.reset(); }; }
  const clearBtn = qs('#clearCommentsBtn'); if(clearBtn) clearBtn.onclick = ()=>{ if(confirm('Clear all comments for this story?')){ s.comments=[]; saveStoriesToLocal(); renderComments(storyId); } };
}

// Export all as ZIP (basic JSON inside zip)
function exportAllAsZip(){
  const data = loadStoriesFromLocal();
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'stories_export.json'; a.click(); URL.revokeObjectURL(url);
}

// Import JSON file handler
function handleImportFile(e){
  const f = e.target.files[0]; if(!f) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const imported = JSON.parse(reader.result);
      if(Array.isArray(imported)){
        localStorage.setItem('stories', JSON.stringify(imported));
        alert('Imported stories. Reloading page.');
        location.reload();
      } else alert('Invalid format');
    }catch(err){ alert('Import failed'); }
  };
  reader.readAsText(f);
}

// Profile export/clear
document.addEventListener('DOMContentLoaded', ()=>{
  if(qs('#exportUserData')) qs('#exportUserData').onclick = ()=>{
    const data = {profile: userProfile, stories: loadStoriesFromLocal()};
    const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download='my_data.json'; a.click();
  };
  if(qs('#clearUserData')) qs('#clearUserData').onclick = ()=>{ if(confirm('Clear profile data?')){ userProfile={}; localStorage.removeItem('userProfile'); alert('Cleared'); location.reload(); } };
});
