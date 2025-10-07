// script.js
// Abhishek's Diary - Improved script with centered Select & Delete popup
// Replace your current script.js with this file

// --- sound setup (tries local asset, falls back to online) ---
let saveSound;
try {
  saveSound = new Audio("assets/sounds/button.mp3");
} catch (e) {
  saveSound = new Audio("https://www.soundjay.com/button/sounds/button-16.mp3");
}
function closeDeletePopup() {
  document.getElementById("deletePopup").classList.remove("active");
}

// state for delete modal
let deleteMode = false;
let selectedEntryIndex = null;
let currentDeleteOverlay = null;
let currentDeleteModal = null;

// run on load
window.addEventListener("DOMContentLoaded", () => {
  displayEntries();
  // make sure textarea exists then focus (if present)
  const ta = document.getElementById('diaryEntry');
  if (ta) ta.focus();
});

// Abhishek's Diary 💖

// 🌸 Password Lock Logic
document.addEventListener("DOMContentLoaded", () => {
  const lock = document.getElementById("passwordLock");
  const msg = document.getElementById("passwordMessage");
  const input = document.getElementById("passwordInput");
  const btn = document.getElementById("passwordButton");
  const content = document.getElementById("diaryContent");

  const savedPass = localStorage.getItem("diaryPass");

  if (!savedPass) {
    msg.textContent = "Set a new password for your diary 💖";
    btn.textContent = "Set Password";
  }

  btn.addEventListener("click", () => {
    const val = input.value.trim();
    if (!val) {
      msg.textContent = "Please enter a password ✨";
      return;
    }

    if (!savedPass) {
      localStorage.setItem("diaryPass", val);
      msg.textContent = "Password saved! 💕 Opening diary...";
      setTimeout(unlockDiary, 800);
    } else if (val === savedPass) {
      msg.textContent = "Welcome back 💌 Opening diary...";
      setTimeout(unlockDiary, 800);
    } else {
      msg.textContent = "Wrong password ❌ Try again";
      input.value = "";
    }
  });

  function unlockDiary() {
    lock.style.opacity = 0;
    setTimeout(() => {
      lock.style.display = "none";
      content.style.display = "block";
    }, 600);
  }
});
// Password lock
function checkPassword() {
  const savedPass = localStorage.getItem('diaryPass');
  if (savedPass) {
    const input = prompt("Enter your diary password:");
    if (input !== savedPass) {
      alert("Wrong password! ❌");
      window.location.href = "index.html";
      return false;
    }
  } else {
    const newPass = prompt("Set your diary password (don’t forget it!) 🔒");
    if (newPass && newPass.trim() !== "") {
      localStorage.setItem('diaryPass', newPass.trim());
      alert("Password set successfully ✅");
    } else {
      alert("Password setup canceled.");
      window.location.href = "index.html";
      return false;
    }
  }
  return true;
}


/* -------------------------
   Save entry
   ------------------------- */
function saveEntry() {
  const entryEl = document.getElementById('diaryEntry');
  if (!entryEl) return;

  const text = entryEl.value.trim();
  if (!text) {
    alert("Write something first!");
    return;
  }

  const entries = JSON.parse(localStorage.getItem('diaryEntries')) || [];
  const now = new Date();

  // simple mood detection
  let mood = "default";
  if (/happy|joy|fun|smile/i.test(text)) mood = "happy";
  else if (/sad|lonely|cry|blue/i.test(text)) mood = "sad";
  else if (/love|heart|romance|sweet/i.test(text)) mood = "love";

  // put newest first
  entries.unshift({ text, date: now.toLocaleString(), mood });
  localStorage.setItem('diaryEntries', JSON.stringify(entries));

  entryEl.value = "";
  showSavedMessage("Saved Successfully 💖");
  playSaveSound();
  displayEntries();
}

function playSaveSound() {
  try {
    saveSound.currentTime = 0;
    saveSound.play().catch(() => { /* ignored if blocked */ });
  } catch (e) {}
}

function showSavedMessage(msg) {
  const s = document.getElementById('savedMessage');
  if (!s) return;
  s.innerText = msg;
  s.style.opacity = 1;
  setTimeout(() => { s.style.opacity = 0; }, 1500);
}

/* -------------------------
   Display entries (sidebar list)
   ------------------------- */
function displayEntries() {
  const list = document.getElementById('entriesList');
  if (!list) return;

  list.innerHTML = "";
  const entries = JSON.parse(localStorage.getItem('diaryEntries')) || [];

  if (entries.length === 0) {
    list.innerHTML = "<p style='text-align:center;color:#666;margin-top:8px;'>No notes yet — your secrets are safe here 💌</p>";
    return;
  }

  entries.forEach((entry, i) => {
    const div = document.createElement('div');
    div.className = "entry";
    div.dataset.index = i;

    // mood-based micro-styling (keeps your theme)
    if (entry.mood === "happy") {
      div.style.background = "#e0ffe0";
      div.style.fontFamily = "Comic Sans MS, cursive";
    } else if (entry.mood === "sad") {
      div.style.background = "#d0e7ff";
      div.style.fontFamily = "Georgia, serif";
    } else if (entry.mood === "love") {
      div.style.background = "#ffe0f0";
      div.style.fontFamily = "'Dancing Script', cursive";
    }

    // preview (short)
    const preview = truncateText(entry.text, 120);
    div.innerHTML = `<span class="meta">${escapeHtml(entry.date)}</span><p>${escapeHtml(preview)}</p>`;

    // clicking sidebar entry when NOT in delete mode can show full in textarea (optional)
    div.addEventListener('click', (e) => {
      if (deleteMode) {
        // if some other flow sets deleteMode, ignore here — selection handled through modal
        return;
      }
      // Put the full entry text back into the textarea for editing/viewing
      const ta = document.getElementById('diaryEntry');
      if (ta) {
        ta.value = entry.text;
        ta.focus();
      }
    });

    list.appendChild(div);
  });
}

/* -------------------------
   Toggle notes sidebar (if present)
   ------------------------- */
function toggleNotes() {
  const sidebar = document.getElementById('notesSidebar');
  if (!sidebar) return;
  const active = sidebar.classList.toggle('active');
  sidebar.setAttribute('aria-hidden', !active);
  displayEntries();
}

/* -------------------------
   Delete flow (centered popup)
   ------------------------- */
function enableDeleteMode() {
  const entries = JSON.parse(localStorage.getItem('diaryEntries')) || [];
  if (entries.length === 0) {
    alert("No notes available to delete!");
    return;
  }

  // Ensure any existing modal is removed first
  closeDeleteModal();

  // build overlay
  const overlay = document.createElement('div');
  overlay.className = 'delete-overlay';
  // inline styles to ensure it shows even if CSS not updated yet
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.background = 'rgba(0,0,0,0.45)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '9999';

  // build modal
  const modal = document.createElement('div');
  modal.className = 'delete-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.style.width = 'min(92%, 520px)';
  modal.style.maxHeight = '86vh';
  modal.style.overflow = 'auto';
  modal.style.borderRadius = '16px';
  modal.style.padding = '14px';
  modal.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)';
  modal.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.98), #fff0f7)';

  // header
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = '8px';
  header.innerHTML = `<h3 style="margin:0;color:#ff6f91;font-family: 'Dancing Script', cursive;">Select a note to delete</h3>
                      <button aria-label="Close" id="deleteModalCloseBtn" style="background:transparent;border:none;font-weight:700;font-size:18px;cursor:pointer;">✕</button>`;
  modal.appendChild(header);

  // list container
  const listWrap = document.createElement('div');
  listWrap.style.display = 'grid';
  listWrap.style.gridTemplateColumns = '1fr';
  listWrap.style.gap = '10px';

  // populate items
  entries.forEach((entry, i) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'delete-item';
    item.dataset.index = i;
    item.style.textAlign = 'left';
    item.style.padding = '10px 12px';
    item.style.borderRadius = '10px';
    item.style.border = '1px solid rgba(0,0,0,0.06)';
    item.style.background = 'rgba(255,255,255,0.9)';
    item.style.cursor = 'pointer';
    item.style.boxShadow = '0 6px 12px rgba(0,0,0,0.04)';
    item.innerHTML = `<div style="font-size:13px;color:#666;margin-bottom:6px;font-weight:600;">${escapeHtml(entry.date)}</div>
                      <div style="font-size:14px;color:#222;">${escapeHtml(truncateText(entry.text, 160))}</div>`;

    // selection behavior
    item.addEventListener('click', () => {
      // deselect others
      listWrap.querySelectorAll('.delete-item').forEach(el => {
        el.style.outline = 'none';
        el.style.boxShadow = '0 6px 12px rgba(0,0,0,0.04)';
        el.dataset.selected = 'false';
        el.style.border = '1px solid rgba(0,0,0,0.06)';
      });
      // mark this selected
      item.dataset.selected = 'true';
      item.style.boxShadow = '0 0 0 3px rgba(255,111,145,0.18)';
      item.style.border = '2px solid #ff6f91';
      selectedEntryIndex = Number(item.dataset.index);
      // enable confirm button
      if (confirmBtn) confirmBtn.disabled = false;
    });

    listWrap.appendChild(item);
  });

  modal.appendChild(listWrap);

  // controls: confirm & cancel
  const controls = document.createElement('div');
  controls.style.display = 'flex';
  controls.style.gap = '10px';
  controls.style.justifyContent = 'center';
  controls.style.marginTop = '12px';

  const confirmBtn = document.createElement('button');
  confirmBtn.type = 'button';
  confirmBtn.textContent = 'Confirm Delete ❌';
  confirmBtn.style.padding = '10px 14px';
  confirmBtn.style.borderRadius = '12px';
  confirmBtn.style.border = 'none';
  confirmBtn.style.cursor = 'pointer';
  confirmBtn.style.background = 'linear-gradient(90deg,#ff9a9e,#fad0c4)';
  confirmBtn.style.color = '#fff';
  confirmBtn.disabled = true; // until something selected

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.textContent = 'Cancel 🚫';
  cancelBtn.style.padding = '10px 14px';
  cancelBtn.style.borderRadius = '12px';
  cancelBtn.style.border = 'none';
  cancelBtn.style.cursor = 'pointer';
  cancelBtn.style.background = 'transparent';
  cancelBtn.style.color = '#ff6f91';

  controls.appendChild(confirmBtn);
  controls.appendChild(cancelBtn);
  modal.appendChild(controls);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // save references for cleanup
  deleteMode = true;
  currentDeleteOverlay = overlay;
  currentDeleteModal = modal;

  // open automatically (focus)
  modal.focus();

  // handlers
  const closeModalHandler = () => { cancelDeleteMode(); };
  const escHandler = (e) => {
    if (e.key === 'Escape') closeModalHandler();
  };

  // close X
  const closeX = document.getElementById('deleteModalCloseBtn');
  if (closeX) closeX.addEventListener('click', closeModalHandler);

  // cancel button
  cancelBtn.addEventListener('click', closeModalHandler);

  // confirm button -> delete
  confirmBtn.addEventListener('click', () => {
    if (selectedEntryIndex === null || selectedEntryIndex === undefined) {
      alert("Please select a note to delete!");
      return;
    }
    let entriesNow = JSON.parse(localStorage.getItem('diaryEntries')) || [];
    if (selectedEntryIndex < 0 || selectedEntryIndex >= entriesNow.length) {
      alert("Selection invalid. Please try again.");
      cancelDeleteMode();
      return;
    }
    // remove selected index
    entriesNow.splice(selectedEntryIndex, 1);
    localStorage.setItem('diaryEntries', JSON.stringify(entriesNow));
    alert("Note deleted successfully 💔");
    cancelDeleteMode();
    displayEntries();
  });

  // escape key closes
  window.addEventListener('keydown', escHandler);

  // store for later removal
  overlay._escHandler = escHandler;
}

/* Close and cleanup delete modal */
function cancelDeleteMode() {
  deleteMode = false;
  selectedEntryIndex = null;

  if (currentDeleteOverlay) {
    // remove escape handler if present
    if (currentDeleteOverlay._escHandler) {
      window.removeEventListener('keydown', currentDeleteOverlay._escHandler);
    }
    // remove DOM elements
    currentDeleteOverlay.remove();
    currentDeleteOverlay = null;
    currentDeleteModal = null;
  }

  // restore focus to textarea
  const ta = document.getElementById('diaryEntry');
  if (ta) ta.focus();
}

/* Utility to force-close any modal (used before creating new one) */
function closeDeleteModal() {
  if (currentDeleteOverlay) {
    if (currentDeleteOverlay._escHandler) {
      window.removeEventListener('keydown', currentDeleteOverlay._escHandler);
    }
    currentDeleteOverlay.remove();
    currentDeleteOverlay = null;
    currentDeleteModal = null;
    deleteMode = false;
    selectedEntryIndex = null;
  }
}

/* -------------------------
   Export / Import helpers (kept simple)
   ------------------------- */
function exportNotes() {
  const data = localStorage.getItem('diaryEntries') || "[]";
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'my_diary_backup.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function handleImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!Array.isArray(parsed)) throw new Error("Invalid format");
      localStorage.setItem('diaryEntries', JSON.stringify(parsed));
      displayEntries();
      alert("Import successful ✅");
    } catch (err) {
      alert("Import failed — file not in the correct format.");
    } finally {
      // clear input so same file can be reselected later
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

/* -------------------------
   Helpers
   ------------------------- */
function escapeHtml(unsafe) {
  return String(unsafe || '')
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncateText(text, maxLen = 100) {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + '...';
}