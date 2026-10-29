
// admin.js
import { auth, db, storage, ADMIN_EMAIL } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const panel = document.getElementById("panel");
const denied = document.getElementById("denied");
const list = document.getElementById("list");
const progress = document.getElementById("progress");

onAuthStateChanged(auth, (user) => {
  if (user && user.email === ADMIN_EMAIL) {
    panel.hidden = false;
    denied.hidden = true;
    loadList();
  } else {
    panel.hidden = true;
    denied.hidden = false;
  }
});

document.getElementById("uploadBtn").onclick = async () => {
  const name = skinName.value.trim();
  const cat = skinCat.value.trim() || "general";
  const file = skinFile.files[0];

  if (!name || !file) return alert("اسم و فایل png لازمه");
  if (file.type !== "image/png") return alert("فقط png");

  try {
    progress.textContent = "در حال آپلود...";
    const path = `skins/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    await addDoc(collection(db, "skins"), {
      name, category: cat, file: url, path,
      createdAt: serverTimestamp()
    });

    progress.textContent = "✅ اضافه شد";
    skinName.value = skinCat.value = skinFile.value = "";
    loadList();
  } catch (e) {
    progress.textContent = "❌ " + e.message;
  }
};

async function loadList() {
  list.innerHTML = "در حال بارگذاری...";
  const q = query(collection(db, "skins"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  if (snap.empty) { list.textContent = "هنوز اسکینی نیست"; return; }

  list.innerHTML = "";
  snap.forEach(d => {
    const s = d.data();
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${s.file}" alt="${s.name}" loading="lazy">
      <div class="info">
        <div class="name">${s.name}</div>
        <div class="cat">${s.category}</div>
      </div>
      <button class="del">🗑 حذف</button>`;

    card.querySelector(".del").onclick = async () => {
      if (!confirm(`«${s.name}» حذف شود؟`)) return;
      try {
        await deleteDoc(doc(db, "skins", d.id));
        if (s.path) {
          try { await deleteObject(ref(storage, s.path)); } catch {}
        }
        card.remove();
      } catch (e) { alert("خطا: " + e.message); }
    };
    list.appendChild(card);
  });
}
