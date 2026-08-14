"use client";

import { useState } from "react";
import { FileUp, ShieldAlert, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/shared/modal";
import { toast } from "@/components/shared/toast";
import { cn } from "@/lib/utils";
import {
  ACCESS_LEVEL_LABELS,
  mockUploadDocument,
  type FieldErrors,
  type KbAccessLevel,
  type KbDocument,
} from "@/lib/mock-kb";
import { KbCategorySelect } from "@/app/(app)/knowledge-base/kb-category-select";

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt"];
const SUPPORTED_FORMATS_MESSAGE = "Supported formats: PDF, DOCX, TXT";

function validateFile(file: File): boolean {
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (ACCEPTED_EXTENSIONS.includes(extension)) return true;
  toast.error(SUPPORTED_FORMATS_MESSAGE, { description: `"${file.name}" was not uploaded.` });
  return false;
}

export function KbUploadModal({
  open,
  onOpenChange,
  onUploaded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded?: (document: KbDocument) => void;
}) {
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accessLevel, setAccessLevel] = useState<KbAccessLevel>("internal");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTitle("");
    setCategoryId("");
    setAccessLevel("internal");
    setFile(null);
    setErrors({});
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrors({});
    const result = await mockUploadDocument({ title, categoryId, accessLevel, fileName: file?.name ?? "" });
    setSubmitting(false);

    if (!result.ok) {
      setErrors(result.errors);
      toast.error("Couldn't upload the document", { description: "Fix the highlighted fields and try again." });
      return;
    }

    toast.success("Document uploaded", { description: `"${result.document.title}" queued for ingestion.` });
    reset();
    onOpenChange(false);
    onUploaded?.(result.document);
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
      title="Upload document"
      description="Add a policy, guide, or reference doc to the knowledge base."
      size="lg"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={submitting}>
            <Upload className="size-4" aria-hidden="true" />
            {submitting ? "Uploading…" : "Upload document"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="kb-upload-file">File</Label>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-neutral-50 px-4 py-8 text-center transition-colors hover:border-primary/50 hover:bg-primary/5">
            <FileUp className="size-6 text-neutral-600" aria-hidden="true" />
            <input
              type="file"
              id="kb-upload-file"
              accept=".pdf,.docx,.txt"
              className="sr-only"
              onChange={(e) => {
                const selected = e.target.files?.[0] ?? null;
                if (selected && validateFile(selected)) setFile(selected);
                e.target.value = "";
              }}
            />
            {file ? (
              <span className="text-sm font-medium text-neutral-950">{file.name}</span>
            ) : (
              <span className="text-sm text-neutral-600">
                Click to choose a file, or drag it here
              </span>
            )}
            <span className="text-xs text-neutral-500">{SUPPORTED_FORMATS_MESSAGE}</span>
          </label>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="kb-upload-title">Title</Label>
          <Input
            id="kb-upload-title"
            placeholder="e.g. Expense Reimbursement Policy"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={!!errors.title}
          />
          {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Category</Label>
          <KbCategorySelect value={categoryId} onChange={setCategoryId} invalid={!!errors.category} />
          {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Access level</Label>
          <div className="inline-flex rounded-md border border-border bg-neutral-50 p-0.5">
            {(["internal", "public"] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setAccessLevel(level)}
                className={cn(
                  "flex-1 rounded-[6px] px-4 py-1.5 text-sm font-medium transition-colors",
                  accessLevel === level
                    ? "bg-surface text-neutral-950 shadow-sm"
                    : "text-neutral-600 hover:text-neutral-950"
                )}
              >
                {ACCESS_LEVEL_LABELS[level]}
              </button>
            ))}
          </div>
        </div>

        {accessLevel === "public" && (
          <div className="flex items-start gap-2.5 rounded-md border border-warning/30 bg-warning/10 px-3 py-2.5">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
            <p className="text-xs leading-5 text-warning">
              Public documents can be surfaced by the customer-facing chatbot. Do not include
              internal or sensitive information.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
