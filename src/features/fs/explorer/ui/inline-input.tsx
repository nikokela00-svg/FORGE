// Inline rename/create row — live validation, Enter commits, Esc cancels, basename selected on mount
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/shared/lib/utils";

import type { NameValidation } from "../lib/tree";
import { validateName } from "../lib/tree";

interface InlineInputProps {
  initialValue: string;
  siblings: readonly { id: string; name: string }[];
  excludeId?: string | null;
  selectBasenameOnly?: boolean;
  placeholder?: string;
  label?: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
}

type NameValidationReason = "empty" | "illegal-char" | "duplicate-sibling";

const MESSAGES: Record<NameValidationReason, string> = {
  empty: "Name cannot be empty",
  "illegal-char": "Invalid name — no slashes, dots, or leading/trailing spaces",
  "duplicate-sibling": "A node with this name already exists here",
};

function InlineInput({
  initialValue,
  siblings,
  excludeId = null,
  selectBasenameOnly = false,
  placeholder = "Enter a name…",
  label = "Rename item",
  onCommit,
  onCancel,
}: InlineInputProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const committedRef = useRef(false);

  useEffect(() => {
    const input = inputRef.current;
    if (input === null) return;
    input.focus();
    const dotIndex = selectBasenameOnly ? input.value.lastIndexOf(".") : -1;
    input.setSelectionRange(0, dotIndex > 0 ? dotIndex : input.value.length);
  }, [selectBasenameOnly]);

  const validation: NameValidation = validateName(value, siblings, excludeId);
  const showError = !validation.ok && value !== "";

  const commit = useCallback(() => {
    if (committedRef.current) return;
    const result = validateName(value, siblings, excludeId);
    if (result.ok) {
      committedRef.current = true;
      onCommit(value);
    }
  }, [value, siblings, excludeId, onCommit]);

  const stop = useCallback((event: React.KeyboardEvent) => {
    event.stopPropagation();
  }, []);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <input
        ref={inputRef}
        role="textbox"
        aria-label={label}
        aria-invalid={showError}
        value={value}
        type="text"
        spellCheck={false}
        placeholder={placeholder}
        onChange={(event) => {
          setValue(event.target.value);
        }}
        onKeyDown={(event) => {
          stop(event);
          if (event.key === "Enter") {
            commit();
          } else if (event.key === "Escape") {
            onCancel();
          }
        }}
        onBlur={commit}
        className={cn(
          "border-border-strong bg-surface-1 text-12 text-fg placeholder:text-fg-subtle focus-visible:ring-focus-ring h-[22px] min-w-0 flex-1 rounded-sm border px-1.5 shadow-none focus-visible:ring-2 focus-visible:outline-none",
          showError && "border-danger",
        )}
      />
      {showError && (
        <p role="alert" className="text-11 text-danger pt-0.5">
          {MESSAGES[validation.reason]}
        </p>
      )}
    </div>
  );
}

export { InlineInput, type InlineInputProps };
