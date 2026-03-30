// /app/components/EditorField.jsx
"use client";
import React, { forwardRef, useImperativeHandle, useRef } from "react";
import SimpleHtmlEditorNoDeps from "./SimpleHtmlEditorNoDeps";

const EditorField = forwardRef(function EditorField(
  { name, label, value, onChange, placeholder = " ", height = 420, required },
  ref
) {
  const hiddenRef = useRef(null);

  // expose a couple of helpers if you like
  useImperativeHandle(ref, () => ({
    clear: () => onChange && onChange(""),
    focus: () => document.querySelector('[contenteditable="true"]')?.focus(),
    // forward the hidden input node (RHF attaches its ref here)
    input: hiddenRef.current,
  }));

  return (
    <div style={{ display: "grid", gap: 6 }}>
      {label && (
        <label style={{ fontSize: 14, fontWeight: 600 }}>
          {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
        </label>
      )}

      {/* Your editor (controlled) */}
      <div className="rte" style={{ border: "1px solid #e5e7eb", padding: 12, borderRadius: 8 }}>
        <SimpleHtmlEditorNoDeps
          initialHTML={value}
          onChange={onChange}
          placeholder={placeholder}
          height={height}
        />
      </div>

      {/* Hidden input that RHF will control/validate/submit */}
      <input
        ref={hiddenRef}             // RHF will attach its ref via Controller's field.ref
        type="hidden"
        name={name}
        value={value || ""}
        readOnly
        required={required}
      />
    </div>
  );
});

export default EditorField;
