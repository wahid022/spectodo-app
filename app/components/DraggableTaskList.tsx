"use client";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { Task } from "@/lib/api";
import TaskCard from "./TaskCard";

type SortableItemProps = {
  task: Task;
  loadingId: string | null;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggle: (task: Task) => void;
  isAlerting?: boolean;
};

function SortableItem({ task, loadingId, onEdit, onDelete, onToggle, isAlerting }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TaskCard
        task={task}
        loadingId={loadingId}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggle={onToggle}
        isDragEnabled
        isAlerting={isAlerting}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

type Props = {
  tasks: Task[];
  isLoading?: boolean;
  loadingId: string | null;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggle: (task: Task) => void;
  onReorder: (activeId: string, overId: string) => void;
  activeAlertIds?: string[];
};

export default function DraggableTaskList({
  tasks,
  isLoading = false,
  loadingId,
  onEdit,
  onDelete,
  onToggle,
  onReorder,
  activeAlertIds = [],
}: Props) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // All hooks must be called before any conditional return
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(String(active.id), String(over.id));
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400 dark:text-gray-600 text-sm">
        <svg className="mr-2 h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Loading tasks…
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg className="mb-3 h-12 w-12 text-gray-200 dark:text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-sm font-medium text-gray-400 dark:text-gray-600">No tasks yet</p>
        <p className="text-xs text-gray-300 dark:text-gray-700 mt-1">Click the + button to add one</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={tasks.map((t) => t.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tasks.map((task) => (
            <SortableItem
              key={task.id}
              task={task}
              loadingId={loadingId}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggle={onToggle}
              isAlerting={activeAlertIds.includes(task.id)}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeTask && (
          <div className="rotate-1 scale-105 shadow-2xl opacity-90">
            <TaskCard
              task={activeTask}
              loadingId={null}
              onEdit={() => {}}
              onDelete={() => {}}
              onToggle={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
