"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { GalleryItem } from "@/types/gallery-item";
import { AdminLogoutButton } from "@/components/admin-logout-button";

function SortableItem({
  item,
  router,
  onDelete,
}: {
  item: GalleryItem;
  router: ReturnType<typeof useRouter>;
  onDelete: (id?: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item._id ?? item.id ?? item.title?.en ?? "" });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="overflow-hidden rounded-xl border border-gray-700 bg-[#1c1c1c]/60">
        <div className="relative h-40 w-full bg-black">
          <img
            src={item.mainImage}
            alt={item.title?.en ?? "Gallery item"}
            className="h-full w-full object-cover"
          />
          <div
            {...attributes}
            {...listeners}
            className="absolute right-2 top-2 cursor-grab rounded-md bg-black/50 p-2 text-white hover:bg-black/70 active:cursor-grabbing"
            title="Drag to reorder"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="12" r="1" />
              <circle cx="9" cy="5" r="1" />
              <circle cx="9" cy="19" r="1" />
              <circle cx="15" cy="12" r="1" />
              <circle cx="15" cy="5" r="1" />
              <circle cx="15" cy="19" r="1" />
            </svg>
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-sm font-semibold text-white">
            {item.title?.en ?? "Untitled"}
          </h3>
          <p className="mt-1 text-xs text-gray-400 line-clamp-2">
            {item.description?.en ?? ""}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push(`/admin?edit=${item._id}`)}
              className="rounded-md border border-gray-500 px-3 py-1 text-xs font-semibold text-gray-200 transition-colors hover:border-gray-300 hover:text-white"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(item._id)}
              className="rounded-md border border-red-500/70 px-3 py-1 text-xs font-semibold text-red-200 transition-colors hover:border-red-400 hover:text-red-100"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminItemsPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchItems = async () => {
    try {
      const response = await fetch("/api/gallery");
      if (!response.ok) {
        throw new Error("Failed to fetch items");
      }
      const data: GalleryItem[] = await response.json();
      setItems(data);
    } catch (error) {
      console.error(error);
      setStatusMessage("Failed to load items.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id?: string) => {
    if (!id) return;
    const confirmed = window.confirm("Delete this item?");
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/gallery/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete item");
      }
      await fetchItems();
    } catch (error) {
      console.error(error);
      setStatusMessage("Failed to delete item.");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex(
      (item) => (item._id ?? item.id ?? item.title?.en) === active.id
    );
    const newIndex = items.findIndex(
      (item) => (item._id ?? item.id ?? item.title?.en) === over.id
    );

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Optimistically update the UI
    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems);

    // Update the order on the server
    try {
      const itemIds = newItems
        .map((item) => item._id)
        .filter((id): id is string => !!id);

      const response = await fetch("/api/gallery/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order");
      }

      setStatusMessage(null);
    } catch (error) {
      console.error(error);
      setStatusMessage("Failed to save new order. Please refresh the page.");
      // Revert to original order on error
      await fetchItems();
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-12 text-white">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Existing Items</h1>
          <p className="mt-2 text-sm text-gray-400">
            Manage gallery items and open any for editing.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="rounded-lg border border-gray-500 px-4 py-2 text-xs font-semibold text-gray-200 transition-colors hover:border-gray-300 hover:text-white"
          >
            Add new item
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/about")}
            className="rounded-lg border border-gray-500 px-4 py-2 text-xs font-semibold text-gray-200 transition-colors hover:border-gray-300 hover:text-white"
          >
            Edit About
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/messages")}
            className="rounded-lg border border-gray-500 px-4 py-2 text-xs font-semibold text-gray-200 transition-colors hover:border-gray-300 hover:text-white"
          >
            View Messages
          </button>
          <AdminLogoutButton />
        </div>
      </div>

      {statusMessage && (
        <p className="mt-4 text-sm text-gray-300">{statusMessage}</p>
      )}

      {isLoading ? (
        <p className="mt-6 text-gray-400">Loading...</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map(
              (item) => item._id ?? item.id ?? item.title?.en ?? ""
            )}
            strategy={rectSortingStrategy}
          >
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <SortableItem
                  key={`${item._id ?? item.id ?? item.title?.en}`}
                  item={item}
                  router={router}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </main>
  );
}
