// script_admin.js - admin page logic: auth, add/edit stories, notice management
let users = JSON.parse(localStorage.getItem('users') || '{}');
let currentUser = localStorage.getItem('currentUser') || null;
let storiesLocal = JSON.parse(localStorage.getItem('stories') || '[]');

function saveAll(){ localStorage.setItem('users', JSON.stringify(users)); localStorage.setItem('stories', JSON.stringify(storiesLocal)); }

document.addEventListener('DOMContentLoaded', ()=>{
  // auth UI
  document.getElementById('loginBtn').onclick = ()=>{ const u=qs('#authUser').value.trim(); const p=qs('#authPass').value.trim(); if(users[u] && users[u]===p){ currentUser=u; localStorage.setItem('currentUser',u); qs('#loggedAs').innerText='Logged in: '+u; qs('#adminPanel').classList.remove('hidden'); refreshAdminList(); } else qs('#authMsg').innerText='Invalid credentials'; };
  document.getElementById('registerBtn').onclick = ()=>{ const u=qs('#authUser').value.trim(); const p=qs('#authPass').value.trim(); if(!u||!p) return qs('#authMsg').innerText='Enter both'; if(users[u]) return qs('#authMsg').innerText='User exists'; users[u]=p; saveAll(); qs('#authMsg').innerText='Registered'; };
  document.getElementById('logoutBtn').onclick = ()=>{ currentUser=null; localStorage.removeItem('currentUser'); qs('#adminPanel').classList.add('hidden'); };
  document.getElementById('addStoryBtn').onclick = ()=>{ if(!currentUser) return alert('Admin only'); const t=qs('#storyTitle').value.trim(); const tags = qs('#storyTags').value.split(',').map(x=>x.trim()).filter(Boolean); const content = qs('#storyContentInput').value; const id = Date.now(); const newS = {id:id,title:t,description:t.substring(0,80),tags:tags,img:'',chapters:[],content:content,views:0,ratings:[],comments:[]}; storiesLocal.push(newS); saveAll(); refreshAdminList(); alert('Added'); };
  document.getElementById('exportAllBtn').onclick = ()=>{ const blob=new Blob([JSON.stringify(storiesLocal,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='stories_admin_export.json'; a.click(); };
  document.getElementById('importStoriesBtn').onclick = ()=>{ const inp=document.createElement('input'); inp.type='file'; inp.accept='application/json'; inp.onchange = (e)=>{ const f=e.target.files[0]; const r=new FileReader(); r.onload=()=>{ try{ const arr = JSON.parse(r.result); if(Array.isArray(arr)){ storiesLocal = arr; saveAll(); refreshAdminList(); alert('Imported'); } }catch(err){ alert('Import failed'); } }; r.readAsText(f); }; inp.click(); };
  document.getElementById('saveNoticeAdmin').onclick = ()=>{ if(!currentUser) return alert('Admin only'); const txt = qs('#noticeInput').value; const level=qs('#noticeLevel').value; const hex=qs('#noticeHex').value; localStorage.setItem('siteNoticeText', txt); localStorage.setItem('siteNoticeLevel', level); localStorage.setItem('siteNoticeColor', hex); alert('Saved notice'); };
  document.getElementById('clearAllBtn').onclick = ()=>{ if(!confirm('Clear all stored data?')) return; localStorage.clear(); location.reload(); };
  refreshAdminList();
});

function refreshAdminList(){
  const list = qs('#storyList'); list.innerHTML='';
  storiesLocal.forEach(s=>{ const d=document.createElement('div'); d.className='card'; d.innerHTML = `<h4>${s.title}</h4><div>Tags: ${s.tags.join(', ')}</div><div style="margin-top:6px"><button class="btn" onclick="editStory(${s.id})">Edit</button><button class="btn" onclick="deleteStory(${s.id})">Delete</button></div>`; list.appendChild(d); });
}

function editStory(id){ const s = storiesLocal.find(x=>x.id===id); if(!s) return; qs('#storyTitle').value = s.title; qs('#storyContentInput').value = s.content; qs('#storyTags').value = s.tags.join(','); qs('#updateStoryBtn').classList.remove('hidden'); qs('#addStoryBtn').classList.add('hidden'); qs('#updateStoryBtn').onclick = ()=>{ s.title = qs('#storyTitle').value; s.tags = qs('#storyTags').value.split(',').map(x=>x.trim()).filter(Boolean); s.content = qs('#storyContentInput').value; saveAll(); refreshAdminList(); alert('Updated'); }; }
function deleteStory(id){ if(!confirm('Delete story?')) return; storiesLocal = storiesLocal.filter(x=>x.id!==id); saveAll(); refreshAdminList(); }
