import React, { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, RefreshCw, Save, Upload } from "lucide-react";
import { Button } from "../components/ui/button";
import { FieldError } from "../components/ui/field";
import { Input } from "../components/ui/input";
import { useAuthStore } from "../context/AuthContext";
import useToast from "../hooks/useToast";
import apiClient from "../lib/utils/network-client";

const EMPTY_FORM = {
  title: "",
  link_url: "",
  image: null,
};

const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
];

const AdvertisementBanner = () => {
  const { user } = useAuthStore();
  const { showErrorToast, showSuccessToast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isDragOverUpload, setIsDragOverUpload] = useState(false);
  const [hasExistingBanner, setHasExistingBanner] = useState(false);
  const fileInputRef = useRef(null);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!form.image) {
      return undefined;
    }

    const objectUrl = URL.createObjectURL(form.image);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [form.image]);

  const fetchBanner = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/advertisement-banner");
      const banner = response.data?.data?.banner;

      if (banner) {
        setForm({
          title: banner.title || "",
          link_url: banner.link_url || "",
          image: null,
        });
        setPreviewUrl(banner.image_url || "");
        setHasExistingBanner(Boolean(banner.id));
      } else {
        setForm(EMPTY_FORM);
        setPreviewUrl("");
        setHasExistingBanner(false);
      }
    } catch (err) {
      showErrorToast(
        err.response?.data?.message || "Failed to load advertisement banner",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchBanner();
    }
  }, [isAdmin]);

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

  const validateForm = () => {
    const nextErrors = {};

    if (!form.title.trim()) {
      nextErrors.title = "Advertisement banner title is required.";
    }

    if (form.link_url.trim()) {
      try {
        new URL(form.link_url.trim());
      } catch {
        nextErrors.link_url = "Enter a valid URL, including http:// or https://.";
      }
    }

    if (!hasExistingBanner && !form.image) {
      nextErrors.image = "Advertisement banner image is required.";
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
      const payload = new FormData();
      payload.append("title", form.title.trim());
      payload.append("link_url", form.link_url.trim());

      if (form.image) {
        payload.append("image", form.image);
      }

      const response = await apiClient.put("/advertisement-banner", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const banner = response.data?.data?.banner;
      if (banner) {
        setForm((current) => ({
          ...current,
          image: null,
        }));
        setPreviewUrl(banner.image_url || "");
        setHasExistingBanner(true);
      }

      showSuccessToast("Advertisement banner saved successfully");
    } catch (err) {
      showErrorToast(
        err.response?.data?.message || "Unable to save advertisement banner",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          Advertisement Banner
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Advertisement banner management is only available for admin users.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Advertisement Banner
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Edit the single advertisement banner with title, link, and image.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={fetchBanner}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <form
        onSubmit={handleSave}
        className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl"
      >
        {isLoading ? (
          <div className="py-12 text-center text-sm font-medium text-slate-500">
            Loading advertisement banner...
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-[1.15fr_0.85fr]">
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
                    placeholder="Hospital health camp promotion"
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
                    placeholder="https://example.com/campaign"
                    className={`rounded-xl ${formErrors.link_url ? "border-red-300 focus-visible:ring-red-500" : ""}`}
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
                    className={`cursor-pointer rounded-3xl border border-dashed p-6 text-center transition-all ${formErrors.image
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
                      alt="Advertisement banner preview"
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

            <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
              <Button type="submit" className="rounded-xl" disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save Advertisement Banner"}
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
};

export default AdvertisementBanner;
