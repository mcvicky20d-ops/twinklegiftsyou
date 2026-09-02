"use client";

import { Trash2 } from "lucide-react";

/**
 * Submits the enclosing form via `formAction`, so a delete can sit inside an
 * edit form without nesting a second <form> (invalid HTML). Two constraints
 * come from React:
 *  - the enclosing form must have its own server `action`, otherwise React
 *    leaves it alone and the browser does a plain native submit;
 *  - the submitter's own name/value is not serialised into the FormData, so
 *    the id has to travel as a real hidden input.
 */
export function DeleteButton({
  action,
  id,
  confirmText,
  label = "Delete",
  idField = "id",
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  confirmText: string;
  label?: string;
  /** Field name the action reads the identifier from. */
  idField?: string;
}) {
  return (
    <>
      <input type="hidden" name={idField} value={id} />
      <button
        type="submit"
        formAction={action}
        formNoValidate
        onClick={(event) => {
          if (!window.confirm(confirmText)) event.preventDefault();
        }}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {label}
      </button>
    </>
  );
}
