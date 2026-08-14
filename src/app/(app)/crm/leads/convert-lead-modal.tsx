"use client";

import { useState } from "react";
import { Modal } from "@/components/shared/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/shared/toast";
import { ISO_CURRENCIES } from "@/lib/mock-org";
import { mockConvertLead, PIPELINE_STAGE_ORDER, PIPELINE_STAGE_LABELS, type ConvertLeadInput, type FieldErrors, type Lead } from "@/lib/mock-crm";

function defaultCloseDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

function splitName(fullName: string): { first: string; last: string } {
  const [first, ...rest] = fullName.trim().split(" ");
  return { first: first ?? "", last: rest.join(" ") };
}

function emptyForm(lead: Lead | null): ConvertLeadInput {
  const { first, last } = splitName(lead?.contactName ?? "");
  return {
    first_name: first,
    last_name: last,
    email: "",
    phone: "",
    title: "",
    company: "",
    amount: "",
    currency: "USD",
    expected_close_date: defaultCloseDate(),
    pipeline_stage: "qualification",
  };
}

export function ConvertLeadModal({
  lead,
  open,
  onOpenChange,
  onConverted,
}: {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConverted: (leadId: string) => void;
}) {
  // Keying on lead.id remounts the dialog (and its form state) fresh whenever
  // a different lead is opened, without needing an effect to re-seed it.
  if (!lead) {
    return (
      <Modal open={false} onOpenChange={onOpenChange} title="Convert lead">
        {null}
      </Modal>
    );
  }
  return <ConvertLeadDialog key={lead.id} lead={lead} open={open} onOpenChange={onOpenChange} onConverted={onConverted} />;
}

function ConvertLeadDialog({
  lead,
  open,
  onOpenChange,
  onConverted,
}: {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConverted: (leadId: string) => void;
}) {
  const [form, setForm] = useState<ConvertLeadInput>(() => emptyForm(lead));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    setErrors({});
    const result = await mockConvertLead(lead.id, form);
    setSubmitting(false);

    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    onConverted(lead.id);
    toast.success(`${form.first_name} ${form.last_name} converted — deal created`);
    onOpenChange(false);
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Convert lead"
      description={`Turn ${lead.contactName} into a contact and open a deal.`}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Converting…" : "Convert"}
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex flex-col gap-6"
      >
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-neutral-950">Contact</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cl-first-name">First name</Label>
              <Input
                id="cl-first-name"
                value={form.first_name}
                onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))}
                aria-invalid={Boolean(errors.first_name)}
              />
              {errors.first_name && <p className="text-xs text-danger">{errors.first_name}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cl-last-name">Last name</Label>
              <Input id="cl-last-name" value={form.last_name} onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cl-email">Email</Label>
              <Input
                id="cl-email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && <p className="text-xs text-danger">{errors.email}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cl-phone">Phone</Label>
              <Input id="cl-phone" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cl-title">Title</Label>
              <Input id="cl-title" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cl-company">Company</Label>
              <Input id="cl-company" value={form.company} onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-border pt-4">
          <h3 className="text-sm font-semibold text-neutral-950">Deal</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cl-amount">Amount</Label>
              <Input
                id="cl-amount"
                type="number"
                min="0"
                value={form.amount}
                onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                aria-invalid={Boolean(errors.amount)}
              />
              {errors.amount && <p className="text-xs text-danger">{errors.amount}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Currency</Label>
              <Select value={form.currency} onValueChange={(value) => setForm((prev) => ({ ...prev, currency: value }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ISO_CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cl-close-date">Expected close date</Label>
              <Input
                id="cl-close-date"
                type="date"
                value={form.expected_close_date}
                onChange={(e) => setForm((prev) => ({ ...prev, expected_close_date: e.target.value }))}
                aria-invalid={Boolean(errors.expected_close_date)}
              />
              {errors.expected_close_date && <p className="text-xs text-danger">{errors.expected_close_date}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Pipeline stage</Label>
              <Select value={form.pipeline_stage} onValueChange={(value) => setForm((prev) => ({ ...prev, pipeline_stage: value }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PIPELINE_STAGE_ORDER.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {PIPELINE_STAGE_LABELS[stage]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
