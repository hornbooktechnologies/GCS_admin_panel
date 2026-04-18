import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Image as ImageIcon,
  LoaderCircle,
  MapPin,
  Save,
  Upload,
} from "lucide-react";
import { Button } from "../ui/button";
import { FieldError } from "../ui/field";
import { Input } from "../ui/input";
import { useAuthStore } from "../../context/AuthContext";
import useToast from "../../hooks/useToast";
import apiClient from "../../lib/utils/network-client";

const EMPTY_FORM = {
  title: "",
  description: "",
  event_date: "",
  place: "",
  thumbnail_image: null,
  gallery_images: [],
};

const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
];

const EventFormPage = ({ mode }) => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const { user } = useAuthStore();
  const { showErrorToast, showSuccessToast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isPageLoading, setIsPageLoading] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState("");
  const [galleryPreviewUrls, setGalleryPreviewUrls] = useState([]);
  const [existingGalleryImages, setExistingGalleryImages] = useState([]);
  const [isDragOverThumbnailUpload, setIsDragOverThumbnailUpload] = useState(false);
  const [isDragOverGalleryUpload, setIsDragOverGalleryUpload] = useState(false);
  const thumbnailInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const isAdmin = user?.role === "admin";
  const isEditMode = mode === "edit";

  const pageTitle = useMemo(
    () => (isEditMode ? "Edit Event" : "Create Event"),
    [isEditMode],
  );

  useEffect(() => {
    if (!form.thumbnail_image) {
      return undefined;
    }

    const objectUrl = URL.createObjectURL(form.thumbnail_image);
    setThumbnailPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [form.thumbnail_image]);

  useEffect(() => {
    if (!form.gallery_images.length) {
      setGalleryPreviewUrls([]);
      return undefined;
    }

    const objectUrls = form.gallery_images.map((file) => URL.createObjectURL(file));
    setGalleryPreviewUrls(objectUrls);

    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [form.gallery_images]);

  useEffect(() => {
    if (!isEditMode || !isAdmin) {
      setIsPageLoading(false);
      return;
    }

    const fetchEvent = async () => {
      setIsPageLoading(true);
      try {
        const response = await apiClient.get(`/events/${eventId}`);
        const event = response.data?.data;

        if (!event) {
          showErrorToast("Event not found");
          navigate("/events");
          return;
        }

        setForm({
          title: event.title || "",
          description: event.description || "",
          event_date: event.event_date ? String(event.event_date).slice(0, 10) : "",
          place: event.place || "",
          thumbnail_image: null,
          gallery_images: [],
        });
        setThumbnailPreviewUrl(event.thumbnail_image_url || "");
        setExistingGalleryImages(event.gallery_images || []);
      } catch (err) {
        showErrorToast(err.response?.data?.message || "Failed to load event");
        navigate("/events");
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, isAdmin, isEditMode, navigate, showErrorToast]);

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

  const areValidImageFiles = (files, field) => {
    if (!files?.length) {
      return false;
    }

    const hasInvalidFile = files.some((file) => !ALLOWED_IMAGE_TYPES.includes(file.type));
    if (hasInvalidFile) {
      setFormErrors((current) => ({
        ...current,
        [field]: "Only JPG, PNG, GIF, or WEBP images are allowed.",
      }));
      return false;
    }

    setFormErrors((current) => ({
      ...current,
      [field]: "",
    }));
    return true;
  };

  const handleThumbnailSelect = (file) => {
    if (!areValidImageFiles(file ? [file] : [], "thumbnail_image")) {
      return;
    }

    handleInputChange("thumbnail_image", file);
  };

  const handleGallerySelect = (files) => {
    const fileList = Array.from(files || []);
    if (!areValidImageFiles(fileList, "gallery_images")) {
      return;
    }

    handleInputChange("gallery_images", fileList);
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.title.trim()) nextErrors.title = "Event title is required.";
    if (!form.description.trim()) nextErrors.description = "Event description is required.";
    if (!form.event_date) nextErrors.event_date = "Event date is required.";
    if (!form.place.trim()) nextErrors.place = "Event place is required.";
    if (!isEditMode && !form.thumbnail_image) {
      nextErrors.thumbnail_image = "Thumbnail image is required.";
    }
    if (!isEditMode && form.gallery_images.length === 0) {
      nextErrors.gallery_images = "At least one gallery image is required.";
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const createFormData = () => {
    const payload = new FormData();
    payload.append("title", form.title.trim());
    payload.append("description", form.description.trim());
    payload.append("event_date", form.event_date);
    payload.append("place", form.place.trim());

    if (form.thumbnail_image) {
      payload.append("thumbnail_image", form.thumbnail_image);
    }

    form.gallery_images.forEach((file) => {
      payload.append("gallery_images", file);
    });

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

      if (isEditMode) {
        await apiClient.put(`/events/${eventId}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccessToast("Event updated successfully");
      } else {
        await apiClient.post("/events", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccessToast("Event created successfully");
      }

      navigate("/events");
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to save event");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{pageTitle}</h1>
        <p className="mt-2 text-sm text-slate-500">
          Event management is only available for admin users.
        </p>
      </div>
    );
  }

  if (isPageLoading) {
    return (
      <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-sm">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading event editor...
        </div>
      </div>
    );
  }

  const displayGalleryImages =
    galleryPreviewUrls.length > 0
      ? galleryPreviewUrls.map((url) => ({ image_url: url }))
      : existingGalleryImages;

  return (
    <div className="max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Button
            type="button"
            variant="ghost"
            className="-ml-3 mb-2 rounded-xl px-3 text-slate-500"
            onClick={() => navigate("/events")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Button>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {pageTitle}
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {isEditMode
              ? "Update event information, thumbnail, and gallery images."
              : "Create an event with title, description, images, date, and place."}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSave}
        className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl"
      >
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Title</label>
              <Input
                value={form.title}
                onChange={(event) => handleInputChange("title", event.target.value)}
                placeholder="Annual health awareness camp"
                className={`rounded-xl ${formErrors.title ? "border-red-300 focus-visible:ring-red-500" : ""}`}
              />
              <FieldError>{formErrors.title}</FieldError>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Description</label>
              <textarea
                value={form.description}
                onChange={(event) =>
                  handleInputChange("description", event.target.value)
                }
                rows={8}
                placeholder="Write event details here..."
                className={`min-h-[180px] w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none ${
                  formErrors.description
                    ? "border-red-300 focus:ring-2 focus:ring-red-500"
                    : "border-slate-200 focus:ring-2 focus:ring-primary/30"
                }`}
              />
              <FieldError>{formErrors.description}</FieldError>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Date</label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="date"
                    value={form.event_date}
                    onChange={(event) =>
                      handleInputChange("event_date", event.target.value)
                    }
                    className={`rounded-xl pl-10 ${formErrors.event_date ? "border-red-300 focus-visible:ring-red-500" : ""}`}
                  />
                </div>
                <FieldError>{formErrors.event_date}</FieldError>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Place</label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    value={form.place}
                    onChange={(event) => handleInputChange("place", event.target.value)}
                    placeholder="GCS Hospital Auditorium"
                    className={`rounded-xl pl-10 ${formErrors.place ? "border-red-300 focus-visible:ring-red-500" : ""}`}
                  />
                </div>
                <FieldError>{formErrors.place}</FieldError>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Thumbnail Image
              </label>
              <div
                role="button"
                tabIndex={0}
                onClick={() => thumbnailInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    thumbnailInputRef.current?.click();
                  }
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragOverThumbnailUpload(true);
                }}
                onDragLeave={() => setIsDragOverThumbnailUpload(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragOverThumbnailUpload(false);
                  handleThumbnailSelect(event.dataTransfer.files?.[0]);
                }}
                className={`cursor-pointer rounded-3xl border border-dashed p-5 text-center transition-all ${
                  formErrors.thumbnail_image
                    ? "border-red-300 bg-red-50/40"
                    : isDragOverThumbnailUpload
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 bg-slate-50 hover:border-primary/40 hover:bg-white"
                }`}
              >
                {thumbnailPreviewUrl ? (
                  <img
                    src={thumbnailPreviewUrl}
                    alt="Thumbnail preview"
                    className="mx-auto mb-4 aspect-[16/10] w-full rounded-2xl object-cover"
                  />
                ) : (
                  <div className="mx-auto mb-4 flex aspect-[16/10] w-full items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
                <p className="text-sm font-semibold text-slate-700">
                  Upload thumbnail image
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  JPG, PNG, GIF, or WEBP up to 5MB
                </p>
              </div>
              <Input
                ref={thumbnailInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                className="hidden"
                onChange={(event) =>
                  handleThumbnailSelect(event.target.files?.[0])
                }
              />
              <FieldError>{formErrors.thumbnail_image}</FieldError>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Gallery Images
              </label>
              <div
                role="button"
                tabIndex={0}
                onClick={() => galleryInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    galleryInputRef.current?.click();
                  }
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragOverGalleryUpload(true);
                }}
                onDragLeave={() => setIsDragOverGalleryUpload(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragOverGalleryUpload(false);
                  handleGallerySelect(event.dataTransfer.files);
                }}
                className={`cursor-pointer rounded-3xl border border-dashed p-6 text-center transition-all ${
                  formErrors.gallery_images
                    ? "border-red-300 bg-red-50/40"
                    : isDragOverGalleryUpload
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 bg-slate-50 hover:border-primary/40 hover:bg-white"
                }`}
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-700">
                  Upload gallery images
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Select multiple images. In edit mode, new uploads replace the current gallery.
                </p>
                {form.gallery_images.length ? (
                  <p className="mt-3 text-xs font-semibold text-primary">
                    Selected: {form.gallery_images.length} image(s)
                  </p>
                ) : null}
              </div>
              <Input
                ref={galleryInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                className="hidden"
                onChange={(event) => handleGallerySelect(event.target.files)}
              />
              <FieldError>{formErrors.gallery_images}</FieldError>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Gallery Preview
              </label>
              {displayGalleryImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {displayGalleryImages.map((item, index) => (
                    <div
                      key={`${item.image_url}-${index}`}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                    >
                      <img
                        src={item.image_url}
                        alt={`Gallery preview ${index + 1}`}
                        className="aspect-[4/3] w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-48 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-slate-400">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => navigate("/events")}
          >
            Cancel
          </Button>
          <Button type="submit" className="rounded-xl" disabled={isSaving}>
            {isSaving ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSaving ? "Saving..." : isEditMode ? "Update Event" : "Create Event"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EventFormPage;
