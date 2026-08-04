import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Image as ImageIcon,
  Images,
  RefreshCw,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { DeleteConfirmationButton } from "../components/common/ConfirmationDialog";
import { Button } from "../components/ui/button";
import { FieldError } from "../components/ui/field";
import { Input } from "../components/ui/input";
import { useAuthStore } from "../context/AuthContext";
import { hasPermission } from "../lib/utils/permissions";
import useToast from "../hooks/useToast";
import apiClient from "../lib/utils/network-client";

const BANNER_SLOTS = [1, 2];
const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
];

function BannerEditor({
  slot,
  banner,
  canDelete,
  onSaved,
  onRemoved,
  showErrorToast,
  showSuccessToast,
}) {
  const [form, setForm] = useState(() => ({
    title: banner?.title || "",
    link_url: banner?.link_url || "",
    image: null,
  }));
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragOverUpload, setIsDragOverUpload] = useState(false);
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState("");
  const fileInputRef = useRef(null);
  const hasExistingBanner = Boolean(banner?.id);
  const previewUrl = selectedPreviewUrl || banner?.image_url || "";

  useEffect(() => {
    if (!form.image) {
      setSelectedPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(form.image);
    setSelectedPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [form.image]);

  const handleInputChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: "" }));
  };

  const validateImageFile = (file) => {
    if (!file) return false;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setFormErrors((current) => ({
        ...current,
        image: "Only JPG, PNG, GIF, or WEBP images are allowed.",
      }));
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormErrors((current) => ({
        ...current,
        image: "The banner image must be 5MB or smaller.",
      }));
      return false;
    }

    setFormErrors((current) => ({ ...current, image: "" }));
    return true;
  };

  const handleImageSelect = (file) => {
    if (validateImageFile(file)) handleInputChange("image", file);
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.title.trim()) {
      nextErrors.title = `Banner ${slot} title is required.`;
    }

    if (form.link_url.trim()) {
      try {
        new URL(form.link_url.trim());
      } catch {
        nextErrors.link_url = "Enter a valid URL, including http:// or https://.";
      }
    }

    if (!hasExistingBanner && !form.image) {
      nextErrors.image = `Banner ${slot} image is required.`;
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const payload = new FormData();
      payload.append("title", form.title.trim());
      payload.append("link_url", form.link_url.trim());
      if (form.image) payload.append("image", form.image);

      const response = await apiClient.put(
        `/advertisement-banner/${slot}`,
        payload,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      const savedBanner = response.data?.data?.banner;
      if (savedBanner) {
        setForm({
          title: savedBanner.title || "",
          link_url: savedBanner.link_url || "",
          image: null,
        });
        onSaved(savedBanner);
      }

      showSuccessToast(`Advertisement banner ${slot} saved successfully`);
    } catch (err) {
      showErrorToast(
        err.response?.data?.message || `Unable to save advertisement banner ${slot}`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!hasExistingBanner || isDeleting) return;

    setIsDeleting(true);
    try {
      await apiClient.delete(`/advertisement-banner/${slot}`);
      onRemoved(slot);
      showSuccessToast(`Advertisement banner ${slot} removed successfully`);
    } catch (err) {
      showErrorToast(
        err.response?.data?.message || `Unable to remove advertisement banner ${slot}`,
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form
      onSubmit={handleSave}
      className="overflow-hidden rounded-xl border border-white/70 bg-white/85 shadow-sm backdrop-blur-xl"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Banner {slot}</h2>
            <p className="text-xs font-medium text-slate-500">
              Display position {slot}
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
            hasExistingBanner
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {hasExistingBanner ? "Configured" : "Not configured"}
        </span>
      </div>

      <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[1fr_0.9fr] xl:grid-cols-1 2xl:grid-cols-[1fr_0.9fr]">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Banner Title
            </label>
            <Input
              value={form.title}
              onChange={(event) => handleInputChange("title", event.target.value)}
              placeholder={`Advertisement banner ${slot} title`}
              className={`rounded-lg ${
                formErrors.title ? "border-red-300 focus-visible:ring-red-500" : ""
              }`}
            />
            <FieldError>{formErrors.title}</FieldError>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Redirect URL
            </label>
            <Input
              value={form.link_url}
              onChange={(event) => handleInputChange("link_url", event.target.value)}
              placeholder="https://example.com/campaign"
              className={`rounded-lg ${
                formErrors.link_url ? "border-red-300 focus-visible:ring-red-500" : ""
              }`}
            />
            <FieldError>{formErrors.link_url}</FieldError>
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
              className={`cursor-pointer rounded-lg border border-dashed p-5 text-center transition-all ${
                formErrors.image
                  ? "border-red-300 bg-red-50/40"
                  : isDragOverUpload
                    ? "border-primary bg-primary/5"
                    : "border-slate-200 bg-slate-50 hover:border-primary/40 hover:bg-white"
              }`}
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
                <Upload className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-700">
                Drop an image or click to browse
              </p>
              {form.image ? (
                <p className="mt-2 break-all text-xs font-semibold text-primary">
                  Selected: {form.image.name}
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-500">
                  JPG, PNG, GIF or WEBP · Maximum 5MB
                </p>
              )}
            </div>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              className="hidden"
              onChange={(event) => handleImageSelect(event.target.files?.[0])}
            />
            <FieldError>{formErrors.image}</FieldError>
          </div>
        </div>

        <div className="min-w-0 space-y-2">
          <label className="text-sm font-semibold text-slate-700">Preview</label>
          <div className="flex min-h-52 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-200 bg-slate-50 p-2">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={`Advertisement banner ${slot} preview`}
                className="max-h-80 w-full rounded-md object-contain"
              />
            ) : (
              <div className="flex aspect-video w-full items-center justify-center text-slate-400">
                <ImageIcon className="h-8 w-8" />
              </div>
            )}
          </div>
          <p className="text-xs leading-5 text-slate-500">
            The public website keeps the full image visible on desktop and mobile.
          </p>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        {hasExistingBanner && canDelete ? (
          <DeleteConfirmationButton
            title={`Remove Banner ${slot}?`}
            description={`Banner ${slot} and its uploaded image will be permanently removed. The other banner will keep its current display slot.`}
            confirmLabel={`Remove Banner ${slot}`}
            onConfirm={handleRemove}
            isLoading={isDeleting}
          >
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-lg border-red-200 text-red-600 hover:bg-red-50 sm:w-auto"
              disabled={isDeleting || isSaving}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove Banner
            </Button>
          </DeleteConfirmationButton>
        ) : (
          <span />
        )}

        <Button type="submit" className="w-full rounded-lg sm:w-auto" disabled={isSaving || isDeleting}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? `Saving Banner ${slot}...` : `Save Banner ${slot}`}
        </Button>
      </div>
    </form>
  );
}

const AdvertisementBanner = () => {
  const { user } = useAuthStore();
  const { showErrorToast, showSuccessToast } = useToast();
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const isAdmin = hasPermission(user, "advertisement-banner", "list");
  const canDelete = hasPermission(user, "advertisement-banner", "delete");

  const bannersBySlot = useMemo(
    () => new Map(banners.map((banner) => [Number(banner.id), banner])),
    [banners],
  );

  const fetchBanners = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/advertisement-banner");
      const responseBanners = response.data?.data?.banners;
      const legacyBanner = response.data?.data?.banner;

      setBanners(
        Array.isArray(responseBanners)
          ? responseBanners
          : legacyBanner
            ? [legacyBanner]
            : [],
      );
    } catch (err) {
      showErrorToast(
        err.response?.data?.message || "Failed to load advertisement banners",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchBanners();
  }, [isAdmin]);

  const handleSaved = (savedBanner) => {
    setBanners((current) => {
      const withoutSavedSlot = current.filter(
        (banner) => Number(banner.id) !== Number(savedBanner.id),
      );
      return [...withoutSavedSlot, savedBanner].sort(
        (first, second) => Number(first.id) - Number(second.id),
      );
    });
  };

  const handleRemoved = (slot) => {
    setBanners((current) =>
      current.filter((banner) => Number(banner.id) !== Number(slot)),
    );
  };

  if (!isAdmin) {
    return (
      <div className="rounded-lg border border-white/60 bg-white/80 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Advertisement Banner</h1>
        <p className="mt-2 text-sm text-slate-500">
          Advertisement banner management is only available for admin users.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1800px] space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Images className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-[0.16em]">
              Two display slots
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Advertisement Banners
          </h1>
          <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500">
            Manage two promotional banners. Each banner has its own title, redirect link,
            image and save action.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full rounded-lg md:w-auto"
          onClick={fetchBanners}
          disabled={isLoading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-white/60 bg-white/80 py-20 text-center text-sm font-medium text-slate-500 shadow-sm">
          Loading advertisement banners...
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {BANNER_SLOTS.map((slot) => {
            const banner = bannersBySlot.get(slot) || null;
            return (
              <BannerEditor
                key={`${slot}-${banner?.updated_at || banner?.image_url || "empty"}`}
                slot={slot}
                banner={banner}
                canDelete={canDelete}
                onSaved={handleSaved}
                onRemoved={handleRemoved}
                showErrorToast={showErrorToast}
                showSuccessToast={showSuccessToast}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdvertisementBanner;
