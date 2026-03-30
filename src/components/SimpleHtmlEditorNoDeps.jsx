"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { EditorProvider } from "./editor/ctx"; // make sure this exists
import HistoryGroup from "./editor/HistoryGroup";
import HeadingGroup from "./editor/HeadingGroup";
import InlineStyleGroup from "./editor/InlineStyleGroup";
import AnchorGroup from "./editor/AnchorGroup";
import LinkContextMenu from "./editor/LinkContextMenu";
import AlignmentGroup from "./editor/AlignmentGroup";
import ListGroup from "./editor/ListGroup";
import ImageGroup from "./editor/ImageGroup";
import ImageContextMenu from "./editor/ImageContextMenu";
import Table from "./editor/Table";
import TableContextMenu from "./editor/TableContextMenu";
import TextColorGroup from "./editor/TextColorGroup";
import BackgroundColorGroup from "./editor/BackgroundColorGroup";



export default function SimpleHtmlEditorNoDeps({
  initialHTML = "<p></p>",
  onChange = () => {},
  placeholder = "Type here…",
  readOnly = false,
  height = 420,
}) {
  const editorRef = useRef(null);
  const savedRangeRef = useRef(null);

  // init
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== initialHTML) {
      editorRef.current.innerHTML = initialHTML;
    }
  }, [initialHTML]);

  // execCommand setup
  useEffect(() => {
    try { document.execCommand("styleWithCSS", false, true); } catch {}
    try { document.execCommand("defaultParagraphSeparator", false, "p"); } catch {}
  }, []);

  // selection helpers (robust)
  const selectionInEditor = () => {
    const root = editorRef.current;
    const sel = window.getSelection();
    if (!root || !sel || sel.rangeCount === 0) return false;
    const range = sel.getRangeAt(0);
    const container = range.commonAncestorContainer.nodeType === 1
      ? range.commonAncestorContainer
      : range.commonAncestorContainer.parentNode;
    return root.contains(container);
  };

  const placeCaretAtEnd = (el) => {
    if (!el) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  };

  useEffect(() => {
    const handleSel = () => {
      if (document.activeElement === editorRef.current) {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) savedRangeRef.current = sel.getRangeAt(0).cloneRange();
      }
    };
    document.addEventListener("selectionchange", handleSel);
    return () => document.removeEventListener("selectionchange", handleSel);
  }, []);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && selectionInEditor()) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    const range = savedRangeRef.current;
    if (sel && range) { sel.removeAllRanges(); sel.addRange(range); }
  };

  const api = useMemo(() => ({
    getHTML: () => editorRef.current?.innerHTML || "",
    setHTML: (html) => { if (!editorRef.current) return; editorRef.current.innerHTML = html; onChange(html); },
    focus: () => editorRef.current?.focus(),
    exec: (cmd, val=null) => {
      restoreSelection();
      if (!selectionInEditor()) placeCaretAtEnd(editorRef.current);
      editorRef.current?.focus();
      document.execCommand(cmd, false, val);
      onChange(editorRef.current?.innerHTML || "");
    },
    insertHTML: (snippet) => {
      restoreSelection();
      if (!selectionInEditor()) placeCaretAtEnd(editorRef.current);
      editorRef.current?.focus();
      document.execCommand("insertHTML", false, snippet);
      onChange(editorRef.current?.innerHTML || "");
    },
  }), [onChange]);

  // ✅ icons defined BEFORE actions
  const icons = {
    undo: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 14l-4-4 4-4" /><path d="M5 10h8a5 5 0 110 10h-1" /></svg>),
    redo: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 6l4 4-4 4" /><path d="M19 10H11a5 5 0 100 10h1" /></svg>),
    H:   (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6v12" /><path d="M6 12h8" /><path d="M14 6v12" /></svg>),
    caret:(<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5H7z" /></svg>),
    ul:  (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6h0M4 12h0M4 18h0" strokeLinecap="round" /></svg>),
    ol:  (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6h1M3 12h2M3 18h2" /></svg>),
    bold:(<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 6h6a3 3 0 010 6H7zM7 12h7a3 3 0 010 6H7z" /></svg>),
    italic:(<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 6h7M7 18h7M14 6l-4 12" /></svg>),
    underline:(<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 4v7a6 6 0 0012 0V4" /><path d="M4 20h16" /></svg>),
    left:(<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 10h10M4 14h16M4 18h10" /></svg>),
    center:(<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M7 10h10M4 14h16M7 18h10" /></svg>),
    right:(<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M10 10h10M4 14h16M10 18h10" /></svg>),
    justify:(<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>),
    image:(<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="M21 17l-5-5-4 4-2-2-4 4"/></svg>),
    table: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="18" height="14" rx="1" />
        <path d="M3 10h18M8 5v14M16 5v14" />
      </svg>
    ),
    link: (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1"/>
    <path d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1"/>
  </svg>
),
  };

  // ✅ define actions (not A), then reuse everywhere
  const actions = {
    undo: () => api.exec('undo'),
    redo: () => api.exec('redo'),
    h: (level) => { api.exec('formatBlock', 'H'+level); api.exec('formatBlock', '<H'+level+'>'); },
    p: () => { api.exec('formatBlock', 'P'); api.exec('formatBlock', '<P>'); },
    bold: () => api.exec('bold'),
    italic: () => api.exec('italic'),
    underline: () => api.exec('underline'),
    ul: () => api.exec('insertUnorderedList'),
    ol: () => api.exec('insertOrderedList'),
    left: () => api.exec('justifyLeft'),
    center: () => api.exec('justifyCenter'),
    right: () => api.exec('justifyRight'),
    justify: () => api.exec('justifyFull'),
  };

  const handleInput = () => onChange(editorRef.current?.innerHTML || "");

  const S = {
    card: { border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", boxShadow: "0 1px 0 rgba(0,0,0,0.02)", overflow: "hidden" },
    toolbar: { display: "flex", alignItems: "center", gap: 18, padding: "12px 18px", background: "#fff" },
    toolbarDivider: { height: 1, background: "#eceff1", width: "100%" },
    group: { display: "flex", alignItems: "center", gap: 16 },
    editor: { minHeight: height, padding: 16, outline: "none" },
  };

  return (
    <div style={S.card}>
      {/* ✅ Provide context with "actions" (not A) */}
      <EditorProvider
        value={{
          actions,
          icons,
          saveSelection,
          insertHTML: api.insertHTML,
          editorEl: editorRef,
          refreshHTML: () => onChange(editorRef.current?.innerHTML || ""),
        }}
      >
        {/* Toolbar */}
        <div style={S.toolbar}>
          {/* If your groups use props, pass actions/icons. 
              If they use context (useEditor), no props needed. */}
          <div style={S.group}><HistoryGroup actions={actions} icons={icons} /></div>
          <div style={S.group}>
            <HeadingGroup />       {/* uses context */}
            <ListGroup actions={actions} icons={icons} /> 
          </div>
          <div style={S.group}>
            <InlineStyleGroup actions={actions} icons={icons} />
            <AnchorGroup />
             <LinkContextMenu />
             <TextColorGroup />          {/* ✅ new */}
    <BackgroundColorGroup />    {/* ✅ new */}
              </div>
          <div style={S.group}><AlignmentGroup actions={actions} icons={icons} /></div>
          <div style={S.group}><ImageGroup /> <ImageContextMenu /></div>
          <div style={S.group}>
  <Table />

    <TableContextMenu />


</div>
        </div>
      </EditorProvider>

      <div style={S.toolbarDivider} />

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!readOnly}
        className="rte"
        suppressContentEditableWarning
        spellCheck
        onInput={handleInput}
        onBlur={handleInput}
        onKeyUp={handleInput}
        onMouseUp={() => {
          const s = window.getSelection();
          if (s && s.rangeCount) savedRangeRef.current = s.getRangeAt(0).cloneRange();
        }}
        style={S.editor}
        data-placeholder={placeholder}
      />
      <style>{`
        [contenteditable="true"]:empty:before { content: attr(data-placeholder); color: #9aa1a9; }
      .rte h1 { font-size: 2rem; line-height: 1.25; font-weight:700; margin:.6em 0 .3em; }
      .rte h2 { font-size: 1.75rem; line-height: 1.3; font-weight:700; margin:.6em 0 .3em; }
      .rte h3 { font-size: 1.5rem; line-height: 1.35; font-weight:700; margin:.6em 0 .3em; }
      .rte h4 { font-size: 1.25rem; line-height: 1.4; font-weight:600; margin:.6em 0 .3em; }
      .rte p  { font-size: 1rem; line-height: 1.6; margin:.5em 0; }
      .rte ul { list-style: disc; padding-left: 1.5rem; margin: .5em 0; }
      .rte ol { list-style: decimal; padding-left: 1.5rem; margin: .5em 0; }
      .rte li { margin: .2em 0; }
      .rte a { text-decoration:underline; }
    `}</style>
    </div>
  );
}
