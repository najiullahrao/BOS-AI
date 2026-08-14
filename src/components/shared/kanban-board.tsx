"use client";

import { useId, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { KanbanCard, type KanbanCardData } from "@/components/shared/kanban-card";

export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCardData[];
}

export interface KanbanBoardProps {
  columns: KanbanColumn[];
  onColumnsChange: (columns: KanbanColumn[]) => void;
  onCardClick?: (card: KanbanCardData) => void;
  /** Fired once when a drag ends with the card in a different column than it started in (i.e. the move is committed, not just a live hover-preview). */
  onCardMoved?: (cardId: string, fromColumnId: string, toColumnId: string) => void;
  className?: string;
}

function findColumnOfCard(columns: KanbanColumn[], cardId: string): KanbanColumn | undefined {
  return columns.find((col) => col.cards.some((card) => card.id === cardId));
}

function SortableCard({ card, onCardClick }: { card: KanbanCardData; onCardClick?: (card: KanbanCardData) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    disabled: card.disabled,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <KanbanCard
        card={card}
        dragHandleProps={card.disabled ? undefined : { ...attributes, ...listeners }}
        isDragging={isDragging}
        onClick={() => onCardClick?.(card)}
      />
    </div>
  );
}

function KanbanColumnView({
  column,
  onCardClick,
}: {
  column: KanbanColumn;
  onCardClick?: (card: KanbanCardData) => void;
}) {
  const { setNodeRef } = useDroppable({ id: column.id });

  return (
    <div
      className={cn(
        "flex w-[85%] shrink-0 snap-center flex-col gap-3 rounded-md border border-border bg-neutral-50 p-3",
        "md:w-72 md:shrink"
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-950">{column.title}</h3>
        <span className="text-xs text-neutral-600">{column.cards.length}</span>
      </div>

      <SortableContext items={column.cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex min-h-16 flex-col gap-2">
          {column.cards.map((card) => (
            <SortableCard key={card.id} card={card} onCardClick={onCardClick} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export function KanbanBoard({ columns, onColumnsChange, onCardClick, onCardMoved, className }: KanbanBoardProps) {
  // dnd-kit's internal aria-describedby id otherwise falls back to a
  // module-level counter that isn't SSR-safe once more than one page in the
  // app renders a DndContext — React's useId() keeps server and client in
  // sync regardless of what else has rendered in this server process.
  const dndContextId = useId();
  const [activeCard, setActiveCard] = useState<KanbanCardData | null>(null);
  const dragStartColumnRef = useRef<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  function handleDragStart(event: DragStartEvent) {
    const column = findColumnOfCard(columns, String(event.active.id));
    const card = column?.cards.find((c) => c.id === event.active.id) ?? null;
    setActiveCard(card);
    dragStartColumnRef.current = column?.id ?? null;
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const sourceColumn = findColumnOfCard(columns, activeId);
    const targetColumn = columns.find((c) => c.id === overId) ?? findColumnOfCard(columns, overId);
    if (!sourceColumn || !targetColumn || sourceColumn.id === targetColumn.id) return;

    const card = sourceColumn.cards.find((c) => c.id === activeId);
    if (!card) return;

    const overIndex = targetColumn.cards.findIndex((c) => c.id === overId);
    const insertIndex = overIndex >= 0 ? overIndex : targetColumn.cards.length;

    onColumnsChange(
      columns.map((col) => {
        if (col.id === sourceColumn.id) {
          return { ...col, cards: col.cards.filter((c) => c.id !== activeId) };
        }
        if (col.id === targetColumn.id) {
          const nextCards = [...col.cards];
          nextCards.splice(insertIndex, 0, card);
          return { ...col, cards: nextCards };
        }
        return col;
      })
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null);
    const startColumnId = dragStartColumnRef.current;
    dragStartColumnRef.current = null;

    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const sourceColumn = findColumnOfCard(columns, activeId);
    if (!sourceColumn) return;

    // Cross-column moves already happened live during drag-over (for visual
    // preview) — at drop time we just need to signal that the move is
    // committed, once, rather than re-deriving the columns array.
    if (startColumnId && sourceColumn.id !== startColumnId) {
      onCardMoved?.(activeId, startColumnId, sourceColumn.id);
      return;
    }

    const targetColumn = columns.find((c) => c.id === overId) ?? findColumnOfCard(columns, overId);
    if (!targetColumn || targetColumn.id !== sourceColumn.id) return;

    const oldIndex = sourceColumn.cards.findIndex((c) => c.id === activeId);
    const newIndex = sourceColumn.cards.findIndex((c) => c.id === overId);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    const reordered = [...sourceColumn.cards];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    onColumnsChange(columns.map((col) => (col.id === sourceColumn.id ? { ...col, cards: reordered } : col)));
  }

  return (
    <DndContext
      id={dndContextId}
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className={cn("flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:snap-none", className)}>
        {columns.map((column) => (
          <KanbanColumnView key={column.id} column={column} onCardClick={onCardClick} />
        ))}
      </div>

      <DragOverlay>{activeCard && <KanbanCard card={activeCard} isDragging />}</DragOverlay>
    </DndContext>
  );
}
