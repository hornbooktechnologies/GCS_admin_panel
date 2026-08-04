import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Image as ImageIcon,
  LoaderCircle,
  Save,
} from "lucide-react";
import { Button } from "../ui/button";
import { FieldError } from "../ui/field";
import { Input } from "../ui/input";
import ImageUploadGuidance from "../common/ImageUploadGuidance";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import useToast from "../../hooks/useToast";
import apiClient from "../../lib/utils/network-client";

const EMPTY_FORM = {
  title: "",
  content: "",
  published_date: "",
  status: "draft",
  featured: false,
  thumbnail_image: null,
  detail_image: null,
};

const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
];

const NewsFormPage = ({ mode }) => {
  const navigate = useNavigate();
  const { newsId } = useParams();
  const { showErrorToast, showSuccessToast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isPageLoading, setIsPageLoading] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState("");
  const [detailPreviewUrl, setDetailPreviewUrl] = useState("");
  const thumbnailInputRef = useRef(null);
  const detailInputRef = useRef(null);

  const isEditMode = mode === "edit";
  const pageTitle = useMemo(
    () => (isEditMode ? "Edit News" : "Create News"),
    [isEditMode],
  );

  useEffect(() => {
    if (!form.thumbnail_image) return undefined;
    const objectUrl = URL.createObjectURL(form.thumbnail_image);
    setThumbnailPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [form.thumbnail_image]);

  useEffect(() => {
    if (!form.detail_image) return undefined;
    const objectUrl = URL.createObjectURL(form.detail_image);
    setDetailPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [form.detail_image]);

  useEffect(() => {
    if (!isEditMode) {
      setIsPageLoading(false);
      return;
    }

    const fetchNewsItem = async () => {
      setIsPageLoading(true);
      try {
        const response = await apiClient.get(`/news/${newsId}`);
        const item = response.data?.data;
        if (!item) {
          showErrorToast("News item not found");
          navigate("/news");
          return;
        }

        setForm({
          title: item.title || item.name || "",
          content: item.content || "",
          published_date: item.published_date ? String(item.published_date).slice(0, 10) : "",
          status: item.status || "draft",
          featured: Boolean(item.featured),
          thumbnail_image: null,
          detail_image: null,
        });
        setThumbnailPreviewUrl(item.thumbnail_image_url || item.image_url || "");
        setDetailPreviewUrl(item.detail_image_url || "");
      } catch (err) {
        showErrorToast(err.response?.data?.message || "Failed to load news item");
        navigate("/news");
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchNewsItem();
  }, [isEditMode, navigate, newsId, showErrorToast]);

  const handleInputChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: "" }));
  };

  const validateImageFile = (file, field) => {
    if (!file) return false;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setFormErrors((current) => ({
        ...current,
        [field]: "Only JPG, PNG, GIF, or WEBP images are allowed.",
      }));
      return false;
    }

    setFormErrors((current) => ({ ...current, [field]: "" }));
    return true;
  };

  const handleImageSelect = (field, file) => {
    if (!validateImageFile(file, field)) {
      return;
    }
    handleInputChange(field, file);
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.title.trim()) nextErrors.title = "Title is required.";
    if (!form.content.trim()) nextErrors.content = "Content is required.";
    if (!form.published_date) nextErrors.published_date = "Published date is required.";
    if (!isEditMode && !form.thumbnail_image) {
      nextErrors.thumbnail_image = "Thumbnail image is required.";
    }
    if (!isEditMode && !form.detail_image) {
      nextErrors.detail_image = "Detail image is required.";
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const createFormData = () => {
    const payload = new FormData();
    payload.append("title", form.title.trim());
    payload.append("content", form.content.trim());
    payload.append("published_date", form.published_date);
    payload.append("status", form.status);
    payload.append("featured", String(form.featured));

    if (form.thumbnail_image) {
      payload.append("thumbnail_image", form.thumbnail_image);
    }

    if (form.detail_image) {
      payload.append("detail_image", form.detail_image);
    }

    return payload;
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const payload = createFormData();

      if (isEditMode) {
        await apiClient.put(`/news/${newsId}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccessToast("News item updated successfully");
      } else {
        await apiClient.post("/news", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccessToast("News item created successfully");
      }

      navigate("/news");
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to save news item");
    } finally {
      setIsSaving(false);
    }
  };

  const renderImageUpload = ({
    label,
    field,
    previewUrl,
    inputRef,
    helperText,
    requirementKey,
    previewAspectClass = "aspect-[16/10]",
  }) => (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={`cursor-pointer rounded-lg border border-dashed p-5 text-center transition-all ${
          formErrors[field]
            ? "border-red-300 bg-red-50/40"
            : "border-slate-200 bg-slate-50 hover:border-primary/40 hover:bg-white"
        }`}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={`${label} preview`}
            className={`mx-auto mb-4 w-full rounded-lg object-cover ${previewAspectClass}`}
          />
        ) : (
          <div className={`mx-auto mb-4 flex w-full items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm ${previewAspectClass}`}>
            <ImageIcon className="h-8 w-8" />
          </div>
        )}
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
        {form[field] ? (
          <p className="mt-3 text-xs font-semibold text-primary">
            Selected: {form[field].name}
          </p>
        ) : null}
      </div>
      <Input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        className="hidden"
        onChange={(event) => handleImageSelect(field, event.target.files?.[0])}
      />
      <FieldError>{formErrors[field]}</FieldError>
      <ImageUploadGuidance
        requirementKey={requirementKey}
        file={form[field]}
        src={previewUrl}
      />
    </div>
  );

  if (isPageLoading) {
    return (
      <div className="rounded-lg border border-white/60 bg-white/80 p-8 shadow-sm">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading news editor...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] space-y-6">
      <div>
        <Button
          type="button"
          variant="ghost"
          className="-ml-3 mb-2 rounded-lg px-3 text-slate-500"
          onClick={() => navigate("/news")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to News
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {pageTitle}
        </h1>
      </div>

      <form
        onSubmit={handleSave}
        className="rounded-lg border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl"
      >
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Title</label>
              <Input
                value={form.title}
                onChange={(event) => handleInputChange("title", event.target.value)}
                className={`rounded-lg ${
                  formErrors.title ? "border-red-300 focus-visible:ring-red-500" : ""
                }`}
              />
              <FieldError>{formErrors.title}</FieldError>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Published Date
                </label>
                <Input
                  type="date"
                  value={form.published_date}
                  onChange={(event) =>
                    handleInputChange("published_date", event.target.value)
                  }
                  className={`rounded-lg ${
                    formErrors.published_date
                      ? "border-red-300 focus-visible:ring-red-500"
                      : ""
                  }`}
                />
                <FieldError>{formErrors.published_date}</FieldError>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Status</label>
                <Select
                  value={form.status}
                  onValueChange={(value) => handleInputChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
              <input
                id="featured"
                type="checkbox"
                checked={form.featured}
                onChange={(event) =>
                  handleInputChange("featured", event.target.checked)
                }
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <label htmlFor="featured" className="text-sm font-medium text-slate-700">
                Mark as featured news
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Content</label>
              <Textarea
                value={form.content}
                onChange={(event) => handleInputChange("content", event.target.value)}
                rows={12}
                className={`rounded-lg ${
                  formErrors.content ? "border-red-300 focus-visible:ring-red-500" : ""
                }`}
                placeholder="Write the full news content here..."
              />
              <FieldError>{formErrors.content}</FieldError>
            </div>
          </div>

          <div className="space-y-4">
            {renderImageUpload({
              label: "Thumbnail Image",
              field: "thumbnail_image",
              previewUrl: thumbnailPreviewUrl,
              inputRef: thumbnailInputRef,
              helperText: "Used on the listing card. JPG, PNG, GIF, or WEBP.",
              requirementKey: "newsThumbnail",
            })}

            {renderImageUpload({
              label: "Detail Image",
              field: "detail_image",
              previewUrl: detailPreviewUrl,
              inputRef: detailInputRef,
              helperText: "Used on the news detail page. JPG, PNG, GIF, or WEBP.",
              requirementKey: "newsDetail",
              previewAspectClass: "aspect-[2/1]",
            })}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            onClick={() => navigate("/news")}
          >
            Cancel
          </Button>
          <Button type="submit" className="rounded-lg" disabled={isSaving}>
            {isSaving ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSaving ? "Saving..." : isEditMode ? "Update News" : "Create News"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewsFormPage;
