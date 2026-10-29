import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

async function load() {
  const snap = await getDocs(collection(db, "skins"));
  allSkins = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  fillCategories();
  render();
}