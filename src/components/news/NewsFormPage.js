import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Image as ImageIcon, LoaderCircle, Save } from "lucide-react";
import { Button } from "../ui/button";
import { FieldError } from "../ui/field";
import { Input } from "../ui/input";
import useToast from "../../hooks/useToast";
import apiClient from "../../lib/utils/network-client";

const EMPTY_FORM = { name: "", image: null };

const NewsFormPage = ({ mode }) => {
  const navigate = useNavigate();
  const { newsId } = useParams();
  const { showErrorToast, showSuccessToast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isPageLoading, setIsPageLoading] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const imageInputRef = useRef(null);

  const isEditMode = mode === "edit";
  const pageTitle = useMemo(() => (isEditMode ? "Edit News" : "Create News"), [isEditMode]);

  useEffect(() => {
    if (!form.image) return undefined;
    const objectUrl = URL.createObjectURL(form.image);
    setImagePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [form.image]);

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
        setForm({ name: item.name || "", image: null });
        setImagePreviewUrl(item.image_url || "");
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

  const handleImageSelect = (file) => {
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
      setFormErrors((current) => ({ ...current, image: "Only image files are allowed." }));
      return;
    }
    handleInputChange("image", file);
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Name is required.";
    if (!isEditMode && !form.image) nextErrors.image = "Image is required.";
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      const payload = new FormData();
      payload.append("name", form.name.trim());
      if (form.image) payload.append("image", form.image);

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

  if (isPageLoading) {
    return (
      <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-sm">
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
        <Button type="button" variant="ghost" className="-ml-3 mb-2 rounded-xl px-3 text-slate-500" onClick={() => navigate("/news")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to News
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{pageTitle}</h1>
      </div>

      <form onSubmit={handleSave} className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Name</label>
              <Input value={form.name} onChange={(event) => handleInputChange("name", event.target.value)} className={`rounded-xl ${formErrors.name ? "border-red-300 focus-visible:ring-red-500" : ""}`} />
              <FieldError>{formErrors.name}</FieldError>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Image</label>
            <div
              role="button"
              tabIndex={0}
              onClick={() => imageInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  imageInputRef.current?.click();
                }
              }}
              className={`cursor-pointer rounded-3xl border border-dashed p-5 text-center transition-all ${formErrors.image ? "border-red-300 bg-red-50/40" : "border-slate-200 bg-slate-50 hover:border-primary/40 hover:bg-white"}`}
            >
              {imagePreviewUrl ? (
                <img src={imagePreviewUrl} alt="Preview" className="mx-auto mb-4 aspect-[16/10] w-full rounded-2xl object-cover" />
              ) : (
                <div className="mx-auto mb-4 flex aspect-[16/10] w-full items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}
              <p className="text-sm font-semibold text-slate-700">Upload image</p>
            </div>
            <Input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/gif" className="hidden" onChange={(event) => handleImageSelect(event.target.files?.[0])} />
            <FieldError>{formErrors.image}</FieldError>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => navigate("/news")}>
            Cancel
          </Button>
          <Button type="submit" className="rounded-xl" disabled={isSaving}>
            {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? "Saving..." : isEditMode ? "Update News" : "Create News"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewsFormPage;
