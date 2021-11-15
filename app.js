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
