import { auth } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ثبت‌نام
window.registerUser = async (email, password) => {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("ثبت‌نام موفق! ✅");
    location.href = "index.html";
  } catch (e) { alert("خطا: " + e.message); }
};

// ورود
window.loginUser = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    location.href = "index.html";
  } catch (e) { alert("خطا: " + e.message); }
};

// خروج
window.logoutUser = () => signOut(auth);

// وضعیت لاگین
onAuthStateChanged(auth, (user) => {
  const el = document.getElementById("user-status");
  if (el) el.textContent = user ? `👤 ${user.email}` : "مهمان";
});