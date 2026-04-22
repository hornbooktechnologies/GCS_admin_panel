import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Image as ImageIcon,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  ExternalLink,
  GripVertical,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useAuthStore } from "../context/AuthContext";
import { hasPermission } from "../lib/utils/permissions";
import useToast from "../hooks/useToast";
import apiClient from "../lib/utils/network-client";

const EMPTY_FORM = {
  title: "",
  link_url: "",
  status: "active",
  image: null,
};

const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
];

const Banners = () => {
  const { user } = useAuthStore();
  const { showErrorToast, showSuccessToast } = useToast();
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [previewUrl, setPreviewUrl] = useState("");
  const [draggedBannerId, setDraggedBannerId] = useState(null);
  const [dropTargetBannerId, setDropTargetBannerId] = useState(null);
  const [isDragOverUpload, setIsDragOverUpload] = useState(false);
  const fileInputRef = useRef(null);

  const isAdmin = hasPermission(user, "banners", "list");
  const canCreate = hasPermission(user, "banners", "create");

  const dialogTitle = useMemo(
    () => (editingBanner ? "Edit Banner" : "Create Banner"),
    [editingBanner],
  );

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setEditingBanner(null);
    setPreviewUrl("");
  };

  const fetchBanners = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/banners", {
        params: { all: true },
      });
      setBanners(response.data?.data?.banners || []);
    } catch (err) {
      showErrorToast(
        err.response?.data?.message || "Failed to load banner data",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchBanners();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!form.image) {
      return undefined;
    }

    const objectUrl = URL.createObjectURL(form.image);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [form.image]);

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (banner) => {
    setEditingBanner(banner);
    setForm({
      title: banner.title || "",
      link_url: banner.link_url || "",
      status: banner.status || "active",
      image: null,
    });
    setPreviewUrl(banner.image_url || "");
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    resetForm();
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

  const validateImageFile = (file) => {
    if (!file) {
      return false;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setFormErrors((current) => ({
        ...current,
        image: "Only JPG, PNG, GIF, or WEBP images are allowed.",
      }));
      return false;
    }

    setFormErrors((current) => ({
      ...current,
      image: "",
    }));
    return true;
  };

  const handleImageSelect = (file) => {
    if (!validateImageFile(file)) {
      return;
    }

    handleInputChange("image", file);
  };

  const createFormData = () => {
    const payload = new FormData();
    payload.append("title", form.title.trim());
    payload.append("link_url", form.link_url.trim());
    payload.append("status", form.status);

    if (form.image) {
      payload.append("image", form.image);
    }

    return payload;
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.title.trim()) {
      nextErrors.title = "Banner title is required.";
    }

    if (form.link_url.trim()) {
      try {
        new URL(form.link_url.trim());
      } catch {
        nextErrors.link_url = "Enter a valid URL, including http:// or https://.";
      }
    }

    if (!editingBanner && !form.image) {
      nextErrors.image = "Banner image is required.";
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
      const payload = createFormData();

      if (editingBanner) {
        await apiClient.put(`/banners/${editingBanner.id}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccessToast("Banner updated successfully");
      } else {
        await apiClient.post("/banners", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccessToast("Banner created successfully");
      }

      closeDialog();
      fetchBanners();
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to save banner");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (banner) => {
    const confirmed = window.confirm(
      `Delete banner "${banner.title}"? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await apiClient.delete(`/banners/${banner.id}`);
      showSuccessToast("Banner deleted successfully");
      fetchBanners();
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to delete banner");
    }
  };

  const persistBannerOrder = async (orderedBanners) => {
    setIsReordering(true);
    try {
      await apiClient.put("/banners/reorder", {
        orderedItems: orderedBanners.map((banner, index) => ({
          id: banner.id,
          display_order: index + 1,
        })),
      });
      showSuccessToast("Banner order updated successfully");
      setBanners(
        orderedBanners.map((banner, index) => ({
          ...banner,
          display_order: index + 1,
        })),
      );
    } catch (err) {
      showErrorToast(
        err.response?.data?.message || "Unable to update banner order",
      );
      fetchBanners();
    } finally {
      setIsReordering(false);
      setDraggedBannerId(null);
      setDropTargetBannerId(null);
    }
  };

  const handleDragStart = (bannerId) => {
    setDraggedBannerId(bannerId);
  };

  const handleDragOverCard = (event, bannerId) => {
    event.preventDefault();

    if (draggedBannerId && draggedBannerId !== bannerId) {
      setDropTargetBannerId(bannerId);
    }
  };

  const handleDropCard = async (event, targetBannerId) => {
    event.preventDefault();

    if (!draggedBannerId || draggedBannerId === targetBannerId) {
      setDraggedBannerId(null);
      setDropTargetBannerId(null);
      return;
    }

    const draggedIndex = banners.findIndex(
      (banner) => banner.id === draggedBannerId,
    );
    const targetIndex = banners.findIndex(
      (banner) => banner.id === targetBannerId,
    );

    if (draggedIndex < 0 || targetIndex < 0) {
      setDraggedBannerId(null);
      setDropTargetBannerId(null);
      return;
    }

    const reordered = [...banners];
    const [movedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, movedItem);
    setBanners(reordered);
    await persistBannerOrder(reordered);
  };

  const handleDragEnd = () => {
    setDraggedBannerId(null);
    setDropTargetBannerId(null);
  };

  if (!isAdmin) {
    return (
      <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Banners</h1>
        <p className="mt-2 text-sm text-slate-500">
          Banner management is only available for admin users.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Banner Management
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Manage homepage banners shown across GCS Hospital CRM.
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Drag cards to reorder banners
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={fetchBanners}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {canCreate && (
            <Button
              type="button"
              className="rounded-xl"
              onClick={openCreateDialog}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Banner
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
        {isLoading ? (
          <div className="py-12 text-center text-sm font-medium text-slate-500">
            Loading banners...
          </div>
        ) : banners.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <ImageIcon className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">
              No banners found
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Create your first banner to populate the admin module.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {banners.map((banner) => (
              <div
                key={banner.id}
                draggable={!isReordering}
                onDragStart={() => handleDragStart(banner.id)}
                onDragOver={(event) => handleDragOverCard(event, banner.id)}
                onDrop={(event) => handleDropCard(event, banner.id)}
                onDragEnd={handleDragEnd}
                className={`overflow-hidden rounded-3xl border bg-white shadow-sm transition-all duration-200 ${
                  draggedBannerId === banner.id
                    ? "scale-[0.98] opacity-60 border-primary/40"
                    : dropTargetBannerId === banner.id
                      ? "border-primary shadow-lg shadow-primary/10 ring-2 ring-primary/10"
                      : "border-slate-100"
                }`}
              >
                <div className="aspect-[16/7] bg-slate-100">
                  {banner.image_url ? (
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                </div>

                <div className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="mt-0.5 rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-400">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-bold text-slate-800">
                          {banner.title}
                        </h2>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          Order: {banner.display_order ?? "-"}
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
                          banner.status === "active"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {banner.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-slate-500">
                    <p className="line-clamp-1">
                      {banner.link_url || "No redirect link configured"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {banner.link_url ? (
                      <a
                        href={banner.link_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        <ExternalLink className="mr-2 h-3.5 w-3.5" />
                        Open Link
                      </a>
                    ) : null}

                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => openEditDialog(banner)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(banner)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
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
                Upload banner artwork and configure how it appears.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 px-6 py-6 md:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Banner Title
                  </label>
                  <Input
                    value={form.title}
                    onChange={(event) =>
                      handleInputChange("title", event.target.value)
                    }
                    placeholder="Homepage hero banner"
                    className={`rounded-xl ${formErrors.title ? "border-red-300 focus-visible:ring-red-500" : ""}`}
                  />
                  <FieldError>{formErrors.title}</FieldError>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Redirect URL
                  </label>
                  <Input
                    value={form.link_url}
                    onChange={(event) =>
                      handleInputChange("link_url", event.target.value)
                    }
                    placeholder="https://example.com/page"
                    className={`rounded-xl ${formErrors.link_url ? "border-red-300 focus-visible:ring-red-500" : ""}`}
                  />
                  <FieldError>{formErrors.link_url}</FieldError>
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

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Banner Image
                  </label>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDragOverUpload(true);
                    }}
                    onDragLeave={() => setIsDragOverUpload(false)}
                    onDrop={(event) => {
                      event.preventDefault();
                      setIsDragOverUpload(false);
                      handleImageSelect(event.dataTransfer.files?.[0]);
                    }}
                    className={`cursor-pointer rounded-3xl border border-dashed p-6 text-center transition-all ${
                      formErrors.image
                        ? "border-red-300 bg-red-50/40"
                        : isDragOverUpload
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 bg-slate-50 hover:border-primary/40 hover:bg-white"
                    }`}
                  >
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                      <Upload className="h-6 w-6" />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-slate-700">
                      Drag and drop an image here
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      or click to browse from your device
                    </p>
                    {form.image ? (
                      <p className="mt-3 text-xs font-semibold text-primary">
                        Selected: {form.image.name}
                      </p>
                    ) : null}
                  </div>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                    className="hidden"
                    onChange={(event) => handleImageSelect(event.target.files?.[0])}
                  />
                  <p className="text-xs text-slate-500">
                    Supports JPG, PNG, GIF, and WEBP up to 5MB.
                  </p>
                  <FieldError>{formErrors.image}</FieldError>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Preview
                </label>
                <div className="overflow-hidden rounded-3xl border border-dashed border-slate-200 bg-slate-50">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Banner preview"
                      className="aspect-[16/9] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[16/9] items-center justify-center text-slate-400">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
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
                {isSaving ? "Saving..." : editingBanner ? "Update Banner" : "Create Banner"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Banners;
