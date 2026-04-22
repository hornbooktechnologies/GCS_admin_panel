import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ExternalLink,
  GripVertical,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Video,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { FieldError } from "../ui/field";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useAuthStore } from "../../context/AuthContext";
import useToast from "../../hooks/useToast";
import { hasPermission } from "../../lib/utils/permissions";
import apiClient from "../../lib/utils/network-client";

const EMPTY_FORM = {
  name: "",
  video_url: "",
  status: "active",
};

const TestimonialsManager = ({
  title,
  subtitle,
  endpoint,
  moduleKey,
  emptyTitle,
  emptyDescription,
}) => {
  const { user } = useAuthStore();
  const { showErrorToast, showSuccessToast } = useToast();
  const canCreate = hasPermission(user, moduleKey, "create");
  const canEdit = hasPermission(user, moduleKey, "edit");
  const canDelete = hasPermission(user, moduleKey, "delete");
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [draggedId, setDraggedId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);

  const dialogTitle = useMemo(
    () => (editingItem ? `Edit ${title}` : `Add ${title}`),
    [editingItem, title],
  );

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(endpoint, {
        params: { all: true },
      });
      setItems(response.data?.data?.testimonials || []);
    } catch (err) {
      showErrorToast(err.response?.data?.message || `Failed to load ${title}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [endpoint]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setEditingItem(null);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (item) => {
    if (!canEdit) {
      return;
    }

    setEditingItem(item);
    setForm({
      name: item.name || "",
      video_url: item.video_url || "",
      status: item.status || "active",
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleInputChange = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setFormErrors((current) => ({
      ...current,
      [field]: "",
    }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Name is required.";
    }

    if (!form.video_url.trim()) {
      nextErrors.video_url = "Video URL is required.";
    } else {
      try {
        new URL(form.video_url.trim());
      } catch {
        nextErrors.video_url =
          "Enter a valid video URL, including http:// or https://.";
      }
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        video_url: form.video_url.trim(),
        status: form.status,
      };

      if (editingItem) {
        await apiClient.put(`${endpoint}/${editingItem.id}`, payload);
        showSuccessToast(`${title} updated successfully`);
      } else {
        await apiClient.post(endpoint, payload);
        showSuccessToast(`${title} created successfully`);
      }

      closeDialog();
      fetchItems();
    } catch (err) {
      showErrorToast(err.response?.data?.message || `Unable to save ${title}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!canDelete) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${item.name}" from ${title.toLowerCase()}? This cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    try {
      await apiClient.delete(`${endpoint}/${item.id}`);
      showSuccessToast(`${title} deleted successfully`);
      fetchItems();
    } catch (err) {
      showErrorToast(
        err.response?.data?.message || `Unable to delete ${title}`,
      );
    }
  };

  const persistOrder = async (orderedItems) => {
    setIsReordering(true);
    try {
      await apiClient.put(`${endpoint}/reorder`, {
        orderedItems: orderedItems.map((item, index) => ({
          id: item.id,
          display_order: index + 1,
        })),
      });
      setItems(
        orderedItems.map((item, index) => ({
          ...item,
          display_order: index + 1,
        })),
      );
      showSuccessToast(`${title} order updated successfully`);
    } catch (err) {
      showErrorToast(
        err.response?.data?.message || `Unable to update ${title} order`,
      );
      fetchItems();
    } finally {
      setIsReordering(false);
      setDraggedId(null);
      setDropTargetId(null);
    }
  };

  const handleDropCard = async (event, targetId) => {
    event.preventDefault();

    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDropTargetId(null);
      return;
    }

    const draggedIndex = items.findIndex((item) => item.id === draggedId);
    const targetIndex = items.findIndex((item) => item.id === targetId);

    if (draggedIndex < 0 || targetIndex < 0) {
      setDraggedId(null);
      setDropTargetId(null);
      return;
    }

    const reordered = [...items];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setItems(reordered);
    await persistOrder(reordered);
  };

  return (
    <div className="max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Drag cards to reorder
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={fetchItems}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {canCreate && (
            <Button type="button" className="rounded-xl" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add New
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
        {isLoading ? (
          <div className="py-12 text-center text-sm font-medium text-slate-500">
            Loading...
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Video className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">{emptyTitle}</h2>
            <p className="mt-1 text-sm text-slate-500">{emptyDescription}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {items.map((item) => (
              <div
                key={item.id}
                draggable={!isReordering}
                onDragStart={() => setDraggedId(item.id)}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (draggedId && draggedId !== item.id) {
                    setDropTargetId(item.id);
                  }
                }}
                onDrop={(event) => handleDropCard(event, item.id)}
                onDragEnd={() => {
                  setDraggedId(null);
                  setDropTargetId(null);
                }}
                className={`rounded-3xl border bg-white p-5 shadow-sm transition-all duration-200 ${
                  draggedId === item.id
                    ? "scale-[0.98] border-primary/40 opacity-60"
                    : dropTargetId === item.id
                      ? "border-primary ring-2 ring-primary/10 shadow-lg shadow-primary/10"
                      : "border-slate-100"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-400">
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-bold text-slate-800">
                        {item.name}
                      </h2>
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        Order: {item.display_order ?? "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isReordering ? (
                      <span className="text-[11px] font-bold uppercase tracking-wide text-primary">
                        Saving...
                      </span>
                    ) : null}
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                        item.status === "active"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    <span>
                      {item.testimonial_date || "-"}
                      {item.testimonial_time ? ` ${item.testimonial_time}` : ""}
                    </span>
                  </div>
                  <div className="line-clamp-1">{item.video_url}</div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <a
                    href={item.video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    <ExternalLink className="mr-2 h-3.5 w-3.5" />
                    Open Video
                  </a>
                  {canEdit && (
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => openEditDialog(item)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(item)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl rounded-3xl border border-white/60 bg-white p-0">
          <form onSubmit={handleSave}>
            <DialogHeader className="border-b border-slate-100 px-6 py-5">
              <DialogTitle>{dialogTitle}</DialogTitle>
              <DialogDescription>
                Manage testimonial details and video URL. Date and time are stored automatically on create.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5 px-6 py-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Name
                </label>
                <Input
                  value={form.name}
                  onChange={(event) =>
                    handleInputChange("name", event.target.value)
                  }
                  placeholder="Enter name"
                  className={`rounded-xl ${formErrors.name ? "border-red-300 focus-visible:ring-red-500" : ""}`}
                />
                <FieldError>{formErrors.name}</FieldError>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Status
                </label>
                <Select
                  value={form.status}
                  onValueChange={(value) => handleInputChange("status", value)}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">
                  Video URL
                </label>
                <Input
                  value={form.video_url}
                  onChange={(event) =>
                    handleInputChange("video_url", event.target.value)
                  }
                  placeholder="https://youtube.com/watch?v=..."
                  className={`rounded-xl ${formErrors.video_url ? "border-red-300 focus-visible:ring-red-500" : ""}`}
                />
                <FieldError>{formErrors.video_url}</FieldError>
              </div>
            </div>

            <DialogFooter className="border-t border-slate-100 px-6 py-5">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={closeDialog}
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl" disabled={isSaving}>
                {isSaving ? "Saving..." : editingItem ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TestimonialsManager;
