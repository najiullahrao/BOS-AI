"use client";

import { useMemo, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { Modal } from "@/components/shared/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CompanyCombobox } from "@/app/(app)/crm/contacts/company-combobox";
import { toast } from "@/components/shared/toast";
import {
  CONTACT_SOURCES,
  SOURCE_LABELS,
  findDuplicateContactByEmail,
  mockCompanies,
  mockCreateContact,
  type Contact,
  type ContactSource,
  type FieldErrors,
} from "@/lib/mock-crm";

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  title: "",
  company: "",
  source: "referral" as ContactSource,
};

export function NewContactModal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (contact: Contact) => void;
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const duplicate = useMemo(() => (form.email ? findDuplicateContactByEmail(form.email) : undefined), [form.email]);
  const companyNames = mockCompanies.map((c) => c.name);

  function reset() {
    setForm(EMPTY_FORM);
    setErrors({});
  }

  async function handleSubmit() {
    setSubmitting(true);
    setErrors({});
    const result = await mockCreateContact(form);
    setSubmitting(false);

    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    onCreated(result.contact);
    toast.success(`${result.contact.first_name} ${result.contact.last_name} added`);
    reset();
    onOpenChange(false);
  }

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
      title="New contact"
      description="Add a person to your CRM."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving…" : "Create contact"}
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="first_name">First name</Label>
            <Input
              id="first_name"
              value={form.first_name}
              onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))}
              aria-invalid={Boolean(errors.first_name)}
            />
            {errors.first_name && <p className="text-xs text-danger">{errors.first_name}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="last_name">Last name</Label>
            <Input
              id="last_name"
              value={form.last_name}
              onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))}
              aria-invalid={Boolean(errors.last_name)}
            />
            {errors.last_name && <p className="text-xs text-danger">{errors.last_name}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && <p className="text-xs text-danger">{errors.email}</p>}
          {duplicate && !errors.email && (
            <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-2 text-xs text-neutral-950">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden="true" />
              <span>
                This email already belongs to {duplicate.first_name} {duplicate.last_name}. You can still create a new
                contact.
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Company</Label>
            <CompanyCombobox
              value={form.company}
              onChange={(value) => setForm((prev) => ({ ...prev, company: value }))}
              companies={companyNames}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Source</Label>
            <Select value={form.source} onValueChange={(value) => setForm((prev) => ({ ...prev, source: value as ContactSource }))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTACT_SOURCES.map((source) => (
                  <SelectItem key={source} value={source}>
                    {SOURCE_LABELS[source]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </form>
    </Modal>
  );
}
