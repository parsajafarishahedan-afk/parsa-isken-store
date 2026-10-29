
// app.js
import { auth, db, ADMIN_EMAIL } from "./firebase-config.js";
import { onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, getDocs, query, orderBy }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const grid = document.getElementById("grid");
const search = document.getElementById("search");
const category = document.getElementById("category");
const empty = document.getElementById("empty");
const nav = document.getElementById("nav");

let all = [];

onAuthStateChanged(auth, (user) => {
  if (!user) {
    nav.innerHTML = `<a href="login.html">ورود</a> | <a href="register.html">ثبت‌نام</a>`;
  } else {
    const adminLink = user.email === ADMIN_EMAIL
      ? ` | <a href="admin.html">🛠 پنل ادمین</a>` : "";
    nav.innerHTML = `👤 ${user.email}${adminLink} | <a href="#" id="logout">خروج</a>`;
    document.getElementById("logout").onclick = (e) => {
      e.preventDefault();
      signOut(auth);
    };
  }
});

async function load() {
  try {
    const q = query(collection(db, "skins"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    fillCats();
    render();
  } catch (e) {
    console.error(e);
    empty.hidden = false;
    empty.textContent = "خطا در بارگذاری — قوانین Firestore رو چک کن";
  }
}

function fillCats() {
  const cats = [...new Set(all.map(s => s.category))];
  cats.forEach(c => {
    const o = document.createElement("option");
    o.value = c; o.textContent = c;
    category.appendChild(o);
  });
}

function render() {
  const q = search.value.trim().toLowerCase();
  const c = category.value;
  const filtered = all.filter(s =>
    (c === "all" || s.category === c) &&
    s.name.toLowerCase().includes(q)
  );

  grid.innerHTML = "";
  empty.hidden = filtered.length > 0;

  filtered.forEach(s => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${s.file}" alt="${s.name}" loading="lazy">
      <div class="info">
        <div class="name">${s.name}</div>
        <div class="cat">${s.category}</div>
      </div>
      <a class="dl" href="${s.file}" download="${s.name}.png">⬇ دانلود</a>`;
    grid.appendChild(card);
  });
}

search.addEventListener("input", render);
category.addEventListener("change", render);
load();
