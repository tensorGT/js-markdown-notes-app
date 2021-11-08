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
