import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ExternalLink,
  FileText,
  GripVertical,
  Image as ImageIcon,
  Megaphone,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { FieldError } from "../components/ui/field";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { useAuthStore } from "../context/AuthContext";
import useToast from "../hooks/useToast";
import { hasPermission } from "../lib/utils/permissions";
import apiClient from "../lib/utils/network-client";

const EMPTY_FORM = {
  title: "",
  is_new: false,
  url: "",
  attachment: null,
};

const ALLOWED_PDF_TYPES = ["application/pdf"];
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

const Announcements = () => {
  const { user } = useAuthStore();
  const { showErrorToast, showSuccessToast } = useToast();
  const canCreate = hasPermission(user, "announcements", "create");
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [draggedId, setDraggedId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const [isDragOverAttachmentUpload, setIsDragOverAttachmentUpload] = useState(false);
  const attachmentInputRef = useRef(null);

  const dialogTitle = useMemo(
    () =>
      editingAnnouncement ? "Edit Announcement" : "Create Announcement",
    [editingAnnouncement],
  );

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/announcements");
      setAnnouncements(response.data?.data?.announcements || []);
    } catch (err) {
      showErrorToast(
        err.response?.data?.message || "Failed to load announcements",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setEditingAnnouncement(null);
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
    setEditingAnnouncement(item);
    setForm({
      title: item.title || "",
      is_new: !!Number(item.is_new),
      url: item.url || "",
      attachment: null,
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

  const validateAttachmentFile = (file) => {
    if (!file) {
      return false;
    }

    const isPdf = ALLOWED_PDF_TYPES.includes(file.type);
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);

    if (!isPdf && !isImage) {
      setFormErrors((current) => ({
        ...current,
        attachment: "Only PDF, JPG, PNG, GIF, and WEBP files are allowed.",
      }));
      return false;
    }

    setFormErrors((current) => ({
      ...current,
      attachment: "",
    }));
    return true;
  };

  const handleAttachmentSelect = (file) => {
    if (!validateAttachmentFile(file)) {
      return;
    }

    handleInputChange("attachment", file);
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.title.trim()) {
      nextErrors.title = "Announcement title is required.";
    }

    if (form.url.trim()) {
      try {
        new URL(form.url.trim());
      } catch {
        nextErrors.url =
          "Enter a valid URL, including http:// or https://.";
      }
    }

    if (!editingAnnouncement && !form.attachment) {
      nextErrors.attachment = "Announcement attachment is required.";
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const createFormData = () => {
    const payload = new FormData();
    payload.append("title", form.title.trim());
    payload.append("url", form.url.trim());
    payload.append("is_new", form.is_new ? "true" : "false");

    if (form.attachment) {
      if (ALLOWED_PDF_TYPES.includes(form.attachment.type)) {
        payload.append("pdf", form.attachment);
      } else {
        payload.append("image", form.attachment);
      }
    }

    return payload;
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const payload = createFormData();

      if (editingAnnouncement) {
        await apiClient.put(`/announcements/${editingAnnouncement.id}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccessToast("Announcement updated successfully");
      } else {
        await apiClient.post("/announcements", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccessToast("Announcement created successfully");
      }

      closeDialog();
      fetchAnnouncements();
    } catch (err) {
      showErrorToast(
        err.response?.data?.message || "Unable to save announcement",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Delete announcement "${item.title}"? This cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    try {
      await apiClient.delete(`/announcements/${item.id}`);
      showSuccessToast("Announcement deleted successfully");
      fetchAnnouncements();
    } catch (err) {
      showErrorToast(
        err.response?.data?.message || "Unable to delete announcement",
      );
    }
  };

  const persistOrder = async (orderedItems) => {
    setIsReordering(true);
    try {
      await apiClient.put("/announcements/reorder", {
        orderedItems: orderedItems.map((item, index) => ({
          id: item.id,
          display_order: index + 1,
        })),
      });
      setAnnouncements(
        orderedItems.map((item, index) => ({
          ...item,
          display_order: index + 1,
        })),
      );
      showSuccessToast("Announcement order updated successfully");
    } catch (err) {
      showErrorToast(
        err.response?.data?.message || "Unable to update announcement order",
      );
      fetchAnnouncements();
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

    const draggedIndex = announcements.findIndex((item) => item.id === draggedId);
    const targetIndex = announcements.findIndex((item) => item.id === targetId);

    if (draggedIndex < 0 || targetIndex < 0) {
      setDraggedId(null);
      setDropTargetId(null);
      return;
    }

    const reordered = [...announcements];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setAnnouncements(reordered);
    await persistOrder(reordered);
  };

  return (
    <div className="max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Announcements
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Manage announcement items with a PDF or image attachment.
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Drag cards to reorder announcements
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={fetchAnnouncements}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {canCreate && (
            <Button type="button" className="rounded-xl" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Announcement
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
        {isLoading ? (
          <div className="py-12 text-center text-sm font-medium text-slate-500">
            Loading announcements...
          </div>
        ) : announcements.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Megaphone className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">
              No announcements found
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Create your first announcement to populate this module.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {announcements.map((item) => (
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
                      <div className="flex items-center gap-2">
                        <h2 className="truncate text-lg font-bold text-slate-800">
                          {item.title}
                        </h2>
                        {Number(item.is_new) === 1 ? (
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                            New
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        Order: {item.display_order ?? "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-sm text-slate-500">
                  {item.image_url ? (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="h-40 w-full object-cover"
                      />
                    </div>
                  ) : null}
                  <div className="line-clamp-1">{item.url || "No URL configured"}</div>
                  <div className="flex items-center gap-2">
                    {item.pdf_url ? (
                      <FileText className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ImageIcon className="h-4 w-4 text-slate-400" />
                    )}
                    <span className="line-clamp-1">
                      {item.pdf_url || item.image_url || "No attachment"}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      <ExternalLink className="mr-2 h-3.5 w-3.5" />
                      Open URL
                    </a>
                  ) : null}
                  {item.pdf_url ? (
                    <a
                      href={item.pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      <FileText className="mr-2 h-3.5 w-3.5" />
                      Open PDF
                    </a>
                  ) : null}
                  {item.image_url ? (
                    <a
                      href={item.image_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      <ImageIcon className="mr-2 h-3.5 w-3.5" />
                      Open Image
                    </a>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => openEditDialog(item)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(item)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
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
                Add announcement metadata, optional URL, and upload either a PDF or an image.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 px-6 py-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Title
                  </label>
                  <Input
                    value={form.title}
                    onChange={(event) =>
                      handleInputChange("title", event.target.value)
                    }
                    placeholder="New policy update"
                    className={`rounded-xl ${formErrors.title ? "border-red-300 focus-visible:ring-red-500" : ""}`}
                  />
                  <FieldError>{formErrors.title}</FieldError>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    URL
                  </label>
                  <Input
                    value={form.url}
                    onChange={(event) =>
                      handleInputChange("url", event.target.value)
                    }
                    placeholder="https://example.com/announcement"
                    className={`rounded-xl ${formErrors.url ? "border-red-300 focus-visible:ring-red-500" : ""}`}
                  />
                  <FieldError>{formErrors.url}</FieldError>
                </div>

                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={form.is_new}
                    onChange={(event) =>
                      handleInputChange("is_new", event.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-semibold text-slate-700">
                    Mark as new
                  </span>
                </label>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Attachment Upload
                  </label>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => attachmentInputRef.current?.click()}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        attachmentInputRef.current?.click();
                      }
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDragOverAttachmentUpload(true);
                    }}
                    onDragLeave={() => setIsDragOverAttachmentUpload(false)}
                    onDrop={(event) => {
                      event.preventDefault();
                      setIsDragOverAttachmentUpload(false);
                      handleAttachmentSelect(event.dataTransfer.files?.[0]);
                    }}
                    className={`cursor-pointer rounded-3xl border border-dashed p-6 text-center transition-all ${
                      formErrors.attachment
                        ? "border-red-300 bg-red-50/40"
                        : isDragOverAttachmentUpload
                          ? "border-primary bg-primary/5"
                          : "border-slate-200 bg-slate-50 hover:border-primary/40 hover:bg-white"
                    }`}
                  >
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                      <Upload className="h-6 w-6" />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-slate-700">
                      Drag and drop a PDF or image here
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      or click to browse from your device
                    </p>
                    {form.attachment ? (
                      <p className="mt-3 text-xs font-semibold text-primary">
                        Selected: {form.attachment.name}
                      </p>
                    ) : editingAnnouncement?.pdf_url || editingAnnouncement?.image_url ? (
                      <p className="mt-3 text-xs font-semibold text-primary">
                        Current attachment available
                      </p>
                    ) : null}
                  </div>
                  <Input
                    ref={attachmentInputRef}
                    type="file"
                    accept="application/pdf,image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={(event) =>
                      handleAttachmentSelect(event.target.files?.[0])
                    }
                  />
                  <p className="text-xs text-slate-500">
                    PDF, JPG, PNG, GIF, or WEBP only, up to 10MB.
                  </p>
                  <FieldError>{formErrors.attachment}</FieldError>
                </div>
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
                {isSaving
                  ? "Saving..."
                  : editingAnnouncement
                    ? "Update Announcement"
                    : "Create Announcement"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Announcements;
