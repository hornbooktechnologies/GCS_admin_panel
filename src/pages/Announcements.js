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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
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
import { DeleteConfirmationButton } from "../components/common/ConfirmationDialog";


const EMPTY_FORM = {
  title: "",
  is_new: false,
  url: "",
  attachment: null,
  category: "Notices",
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
  const [selectedAttachmentUrl, setSelectedAttachmentUrl] = useState("");
  const attachmentInputRef = useRef(null);

  const dialogTitle = useMemo(
    () =>
      editingAnnouncement ? "Edit Announcement" : "Create Announcement",
    [editingAnnouncement],
  );

  const existingAttachmentUrl =
    editingAnnouncement?.pdf_url || editingAnnouncement?.image_url || "";
  const existingAttachmentIsPdf = !!editingAnnouncement?.pdf_url;
  const selectedAttachmentIsImage =
    form.attachment && ALLOWED_IMAGE_TYPES.includes(form.attachment.type);

  useEffect(() => {
    if (!form.attachment || typeof URL.createObjectURL !== "function") {
      setSelectedAttachmentUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(form.attachment);
    setSelectedAttachmentUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [form.attachment]);

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
      category: item.category || "Notices",
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

  const clearSelectedAttachment = () => {
    handleInputChange("attachment", null);
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = "";
    }
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
    payload.append("category", form.category);

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
            className="rounded-lg"
            onClick={fetchAnnouncements}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {canCreate && (
            <Button type="button" className="rounded-lg" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Announcement
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
        {isLoading ? (
          <div className="py-12 text-center text-sm font-medium text-slate-500">
            Loading announcements...
          </div>
        ) : announcements.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
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
                className={`rounded-lg border bg-white p-5 shadow-sm transition-all duration-200 ${
                  draggedId === item.id
                    ? "scale-[0.98] border-primary/40 opacity-60"
                    : dropTargetId === item.id
                      ? "border-primary ring-2 ring-primary/10 shadow-lg shadow-primary/10"
                      : "border-slate-100"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-400">
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
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {item.category || "Notices"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        Order: {item.display_order ?? "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-sm text-slate-500">
                  {item.image_url ? (
                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
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
                      className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
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
                      className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
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
                      className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      <ImageIcon className="mr-2 h-3.5 w-3.5" />
                      Open Image
                    </a>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-lg"
                    onClick={() => openEditDialog(item)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <DeleteConfirmationButton onConfirm={() => handleDelete(item)}>
<Button
                    type="button"
                    variant="outline"
                    className="rounded-lg border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
</DeleteConfirmationButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => (open ? setIsDialogOpen(true) : closeDialog())}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-lg border border-white/60 bg-white p-0 sm:max-w-2xl">
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
                    className={`rounded-lg ${formErrors.title ? "border-red-300 focus-visible:ring-red-500" : ""}`}
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
                    className={`rounded-lg ${formErrors.url ? "border-red-300 focus-visible:ring-red-500" : ""}`}
                  />
                  <FieldError>{formErrors.url}</FieldError>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Category
                  </label>
                  <Select value={form.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Notices">Notices</SelectItem>
                      <SelectItem value="Admissions">Admissions</SelectItem>
                      <SelectItem value="Opportunities">Opportunities</SelectItem>
                      <SelectItem value="Events">Events</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
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
                    className={`cursor-pointer rounded-lg border border-dashed p-6 text-center transition-all ${
                      formErrors.attachment
                        ? "border-red-300 bg-red-50/40"
                        : isDragOverAttachmentUpload
                          ? "border-primary bg-primary/5"
                          : "border-slate-200 bg-slate-50 hover:border-primary/40 hover:bg-white"
                    }`}
                  >
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
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
                    ) : existingAttachmentUrl ? (
                      <p className="mt-3 text-xs font-semibold text-primary">
                        Choose a file only if you want to replace the current attachment
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

                  {form.attachment ? (
                    <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
                            {selectedAttachmentIsImage ? (
                              <ImageIcon className="h-5 w-5" />
                            ) : (
                              <FileText className="h-5 w-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-wide text-primary">
                              {existingAttachmentUrl
                                ? "Selected replacement"
                                : "Selected attachment"}
                            </p>
                            <p className="mt-1 truncate text-sm font-semibold text-slate-700">
                              {form.attachment.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedAttachmentUrl ? (
                            <a
                              href={selectedAttachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-primary transition hover:bg-blue-50"
                            >
                              <ExternalLink className="mr-2 h-3.5 w-3.5" />
                              {selectedAttachmentIsImage ? "View Image" : "View PDF"}
                            </a>
                          ) : null}
                          <Button
                            type="button"
                            variant="outline"
                            className="h-auto rounded-lg px-3 py-2 text-xs"
                            onClick={clearSelectedAttachment}
                          >
                            Remove Selection
                          </Button>
                        </div>
                      </div>
                      {selectedAttachmentIsImage && selectedAttachmentUrl ? (
                        <div className="mt-4 overflow-hidden rounded-lg border border-blue-100 bg-white">
                          <img
                            src={selectedAttachmentUrl}
                            alt={`Selected attachment preview for ${form.title || "announcement"}`}
                            className="max-h-64 w-full object-contain"
                          />
                        </div>
                      ) : null}
                      {existingAttachmentUrl ? (
                        <p className="mt-3 text-xs text-slate-600">
                          This file will replace the current attachment only after you save the announcement.
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {existingAttachmentUrl ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm">
                            {existingAttachmentIsPdf ? (
                              <FileText className="h-5 w-5" />
                            ) : (
                              <ImageIcon className="h-5 w-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                              Current {existingAttachmentIsPdf ? "PDF" : "image"}
                            </p>
                            <p className="mt-1 text-xs text-slate-600">
                              {form.attachment
                                ? "This remains active until the replacement is saved."
                                : "This attachment will be kept if you do not select a replacement."}
                            </p>
                          </div>
                        </div>
                        <a
                          href={existingAttachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          <ExternalLink className="mr-2 h-3.5 w-3.5" />
                          View {existingAttachmentIsPdf ? "PDF" : "Image"}
                        </a>
                      </div>
                      {!existingAttachmentIsPdf ? (
                        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
                          <img
                            src={existingAttachmentUrl}
                            alt={`Current attachment for ${form.title || "announcement"}`}
                            className="max-h-64 w-full object-contain"
                          />
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-slate-100 px-6 py-5">
              <Button
                type="button"
                variant="outline"
                className="rounded-lg"
                onClick={closeDialog}
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-lg" disabled={isSaving}>
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
