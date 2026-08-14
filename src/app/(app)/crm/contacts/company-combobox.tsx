"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

export function CompanyCombobox({
  value,
  onChange,
  companies,
}: {
  value: string;
  onChange: (value: string) => void;
  companies: string[];
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);

  const filtered = companies.filter((c) => c.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="relative">
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search companies…"
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-border bg-surface py-1 shadow-md">
          {filtered.map((c) => (
            <button
              key={c}
              type="button"
              className="block w-full px-3 py-1.5 text-left text-sm text-neutral-950 hover:bg-neutral-50"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(c);
                setQuery(c);
                setOpen(false);
              }}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
