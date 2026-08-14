"use client";

import { useState } from "react";
import { Modal } from "@/components/shared/modal";
import { toast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockTeamMembers } from "@/lib/mock-team";
import {
  getAllKnownContactNames,
  mockCreateTicket,
  PRIORITY_LABELS,
  type FieldErrors,
  type Ticket,
  type TicketPriority,
} from "@/lib/mock-tickets";

const UNASSIGNED_VALUE = "__unassigned__";

const EMPTY_FORM = {
  subject: "",
  contact: "",
  priority: "medium" as TicketPriority,
  assignee: UNASSIGNED_VALUE,
};

export function NewTicketModal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (ticket: Ticket) => void;
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const contactNames = getAllKnownContactNames();
  const assignableMembers = mockTeamMembers.filter((m) => m.status === "active");

  function reset() {
    setForm(EMPTY_FORM);
    setErrors({});
  }

  async function handleSubmit() {
    setSubmitting(true);
    setErrors({});
    const result = await mockCreateTicket({
      subject: form.subject,
      contact: form.contact,
      priority: form.priority,
      assignee: form.assignee === UNASSIGNED_VALUE ? null : form.assignee,
    });
    setSubmitting(false);

    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    onCreated(result.ticket);
    toast.success("Ticket created");
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
      title="New ticket"
      description="Log a support ticket for a contact."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Creating…" : "Create ticket"}
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
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={form.subject}
            onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
            aria-invalid={Boolean(errors.subject)}
          />
          {errors.subject && <p className="text-xs text-danger">{errors.subject}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Contact</Label>
          <Select value={form.contact} onValueChange={(value) => setForm((prev) => ({ ...prev, contact: value }))}>
            <SelectTrigger className="w-full" aria-invalid={Boolean(errors.contact)}>
              <SelectValue placeholder="Select a contact" />
            </SelectTrigger>
            <SelectContent>
              {contactNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.contact && <p className="text-xs text-danger">{errors.contact}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={(value) => setForm((prev) => ({ ...prev, priority: value as TicketPriority }))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PRIORITY_LABELS) as TicketPriority[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Assignee</Label>
            <Select value={form.assignee} onValueChange={(value) => setForm((prev) => ({ ...prev, assignee: value }))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
                {assignableMembers.map((m) => (
                  <SelectItem key={m.id} value={m.name}>
                    {m.name}
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
