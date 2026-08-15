"use client";

import { useId, useState } from "react";
import { GripVertical, Plus, X, Zap } from "lucide-react";
import { DndContext, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  INVOKE_AI_AGENT_HELPER,
  nextWorkflowActionId,
  WORKFLOW_ACTION_CONFIG_LABELS,
  WORKFLOW_ACTION_CONFIG_PLACEHOLDERS,
  WORKFLOW_ACTION_DEFAULTS,
  WORKFLOW_ACTION_LABELS,
  WORKFLOW_ACTION_TYPES,
  WORKFLOW_TRIGGER_LABELS,
  WORKFLOW_TRIGGER_PLACEHOLDERS,
  type WorkflowAction,
  type WorkflowActionType,
  type WorkflowDraft,
  type WorkflowTriggerType,
} from "@/lib/mock-workflows";

const TRIGGER_OPTIONS = (Object.keys(WORKFLOW_TRIGGER_LABELS) as WorkflowTriggerType[]).map((type) => ({
  label: WORKFLOW_TRIGGER_LABELS[type],
  value: type,
}));

const ACTION_OPTIONS = WORKFLOW_ACTION_TYPES.map((type) => ({
  label: WORKFLOW_ACTION_LABELS[type],
  value: type,
}));

function SortableActionRow({
  action,
  onConfigChange,
  onRemove,
}: {
  action: WorkflowAction;
  onConfigChange: (id: string, config: string) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: action.id });
  const label = WORKFLOW_ACTION_LABELS[action.type];

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <div className={cn("flex items-start gap-2 rounded-md border border-border bg-surface p-3", isDragging && "shadow-sm")}>
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${label}`}
          className="mt-1 cursor-grab touch-none rounded-md p-1 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950"
        >
          <GripVertical className="size-4" aria-hidden="true" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-neutral-950">{label}</span>
            <Button variant="ghost" size="icon-sm" aria-label={`Remove ${label}`} onClick={() => onRemove(action.id)}>
              <X className="size-3.5" />
            </Button>
          </div>

          <div className="mt-2 flex flex-col gap-1.5">
            <Label className="text-xs text-neutral-600" htmlFor={`action-config-${action.id}`}>
              {WORKFLOW_ACTION_CONFIG_LABELS[action.type]}
            </Label>
            {action.type === "invoke_ai_agent" ? (
              <Textarea
                id={`action-config-${action.id}`}
                value={action.config}
                onChange={(e) => onConfigChange(action.id, e.target.value)}
                placeholder={WORKFLOW_ACTION_CONFIG_PLACEHOLDERS[action.type]}
                rows={2}
              />
            ) : (
              <Input
                id={`action-config-${action.id}`}
                value={action.config}
                onChange={(e) => onConfigChange(action.id, e.target.value)}
                placeholder={WORKFLOW_ACTION_CONFIG_PLACEHOLDERS[action.type]}
              />
            )}
          </div>

          {action.type === "invoke_ai_agent" && (
            <p className="mt-1.5 text-xs text-neutral-600">{INVOKE_AI_AGENT_HELPER}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function WorkflowBuilder({
  initial,
  onSave,
  onCancel,
  saveLabel = "Save workflow",
}: {
  initial: WorkflowDraft;
  onSave: (draft: WorkflowDraft) => void;
  onCancel: () => void;
  saveLabel?: string;
}) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [triggerType, setTriggerType] = useState<WorkflowTriggerType>(initial.triggerType);
  const [condition, setCondition] = useState(initial.condition);
  const [actions, setActions] = useState<WorkflowAction[]>(initial.actions);
  const [pendingAction, setPendingAction] = useState<WorkflowActionType | "">("");

  const dndContextId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;
    setActions((prev) => {
      const oldIndex = prev.findIndex((action) => action.id === activeId);
      const newIndex = prev.findIndex((action) => action.id === overId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  function handleAddAction() {
    if (!pendingAction) return;
    setActions((prev) => [
      ...prev,
      { id: nextWorkflowActionId(), type: pendingAction, config: WORKFLOW_ACTION_DEFAULTS[pendingAction] },
    ]);
    setPendingAction("");
  }

  const canSave = name.trim().length > 0 && condition.trim().length > 0 && actions.length > 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="wf-name">Workflow name</Label>
        <Input id="wf-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Urgent ticket escalation" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="wf-description">Description</Label>
        <Textarea
          id="wf-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this workflow automate?"
          rows={2}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Trigger</Label>
          <Select value={triggerType} onValueChange={(value) => setTriggerType(value as WorkflowTriggerType)}>
            <SelectTrigger aria-label="Trigger">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRIGGER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="wf-condition">Trigger condition</Label>
          <Input
            id="wf-condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            placeholder={WORKFLOW_TRIGGER_PLACEHOLDERS[triggerType]}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Actions</Label>
          {actions.length > 1 && <span className="text-xs text-neutral-600">Drag to reorder</span>}
        </div>

        {actions.length === 0 && (
          <p className="rounded-md border border-dashed border-neutral-200 px-3 py-2 text-sm text-neutral-600">
            No actions yet. Add at least one action to save this workflow.
          </p>
        )}

        <DndContext id={dndContextId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={actions.map((action) => action.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {actions.map((action) => (
                <SortableActionRow
                  key={action.id}
                  action={action}
                  onConfigChange={(id, config) =>
                    setActions((prev) => prev.map((a) => (a.id === id ? { ...a, config } : a)))
                  }
                  onRemove={(id) => setActions((prev) => prev.filter((a) => a.id !== id))}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className="flex items-center gap-2">
          <Select value={pendingAction} onValueChange={(value) => setPendingAction(value as WorkflowActionType | "")}>
            <SelectTrigger aria-label="Add action" className="flex-1">
              <SelectValue placeholder="Add action…" />
            </SelectTrigger>
            <SelectContent>
              {ACTION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleAddAction} disabled={!pendingAction}>
            <Plus className="size-3.5" />
            Add
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={() => onSave({ name, description, triggerType, condition, actions })} disabled={!canSave}>
          <Zap className="size-3.5" />
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}
