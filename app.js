var STORAGE_KEY = "md_notes_v1";

var notes = loadNotes();
var activeId = getHashNoteId() || (notes[0] && notes[0].id) || null;

var noteListEl = document.getElementById("note-list");
var searchEl = document.getElementById("note-search");
var tagFilterEl = document.getElementById("tag-filter");
var titleEl = document.getElementById("note-title");
var tagEl = document.getElementById("note-tag");
var mdInputEl = document.getElementById("md-input");
var previewEl = document.getElementById("md-preview");

function loadNotes() {
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return [
    {
      id: "n1",
      title: "Welcome Note",
      tag: "general",
      body: "# Hello!\n\nWrite some **markdown** on the left and see it on the right.\n\n- Supports lists\n- Supports `inline code`\n> And blockquotes!"
    }
  ];
}

function saveNotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function getHashNoteId() {
  return window.location.hash ? window.location.hash.slice(1) : null;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// simple safe markdown parser (escapes raw html first so no xss)
function parseMarkdown(raw) {
  var safe = escapeHtml(raw);
  // code blocks
  safe = safe.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");
  var lines = safe.split("\n");
  var out = [];
  var inList = false;

  lines.forEach(function (line) {
    if (line.match(/^###\s+/)) {
      if (inList) { out.push("</ul>"); inList = false; }
      out.push("<h3>" + inlineFormat(line.replace(/^###\s+/, "")) + "</h3>");
    } else if (line.match(/^##\s+/)) {
      if (inList) { out.push("</ul>"); inList = false; }
      out.push("<h2>" + inlineFormat(line.replace(/^##\s+/, "")) + "</h2>");
    } else if (line.match(/^#\s+/)) {
      if (inList) { out.push("</ul>"); inList = false; }
      out.push("<h1>" + inlineFormat(line.replace(/^#\s+/, "")) + "</h1>");
    } else if (line.match(/^&gt;\s+/)) {
      if (inList) { out.push("</ul>"); inList = false; }
      out.push("<blockquote>" + inlineFormat(line.replace(/^&gt;\s+/, "")) + "</blockquote>");
    } else if (line.match(/^[-*]\s+/)) {
      if (!inList) { out.push("<ul>"); inList = true; }
      out.push("<li>" + inlineFormat(line.replace(/^[-*]\s+/, "")) + "</li>");
    } else if (line.trim() === "") {
      if (inList) { out.push("</ul>"); inList = false; }
    } else {
      if (inList) { out.push("</ul>"); inList = false; }
      out.push("<p>" + inlineFormat(line) + "</p>");
    }
  });
  if (inList) out.push("</ul>");
  return out.join("\n");
}

function inlineFormat(txt) {
  return txt
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function getActiveNote() {
  return notes.find(function (n) { return n.id === activeId; }) || null;
}

function renderSidebar() {
  var q = searchEl.value.trim().toLowerCase();
  var selectedTag = tagFilterEl.value;

  // refresh tag dropdown
  var tags = Array.from(new Set(notes.map(function (n) { return n.tag || "general"; })));
  tagFilterEl.innerHTML = '<option value="all">All tags</option>';
  tags.forEach(function (t) {
    var opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    if (t === selectedTag) opt.selected = true;
    tagFilterEl.appendChild(opt);
  });

  noteListEl.innerHTML = "";
  notes.filter(function (n) {
    if (selectedTag !== "all" && (n.tag || "general") !== selectedTag) return false;
    if (q && (n.title + " " + n.body).toLowerCase().indexOf(q) === -1) return false;
    return true;
  }).forEach(function (n) {
    var li = document.createElement("li");
    li.className = "note-item" + (n.id === activeId ? " active" : "");
    li.innerHTML = "<strong></strong><small></small>";
    li.querySelector("strong").textContent = n.title || "Untitled";
    li.querySelector("small").textContent = "#" + (n.tag || "general");
    li.addEventListener("click", function () {
      activeId = n.id;
      window.location.hash = n.id;
      loadActiveIntoEditor();
      renderSidebar();
    });
    noteListEl.appendChild(li);
  });
}

function loadActiveIntoEditor() {
  var note = getActiveNote();
  if (!note) {
    titleEl.value = "";
    tagEl.value = "";
    mdInputEl.value = "";
    previewEl.innerHTML = "<p>Select or create a note.</p>";
    return;
  }
  titleEl.value = note.title;
  tagEl.value = note.tag;
  mdInputEl.value = note.body;
  previewEl.innerHTML = parseMarkdown(note.body);
