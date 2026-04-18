import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Image as ImageIcon, LoaderCircle, Save } from "lucide-react";
import { Button } from "../ui/button";
import { FieldError } from "../ui/field";
import { Input } from "../ui/input";
import useToast from "../../hooks/useToast";
import apiClient from "../../lib/utils/network-client";

const EMPTY_FORM = {
  title: "",
  position: "",
  image: null,
  description: "",
};

const VALID_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

const StudentTestimonialFormPage = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showErrorToast, showSuccessToast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isPageLoading, setIsPageLoading] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const imageInputRef = useRef(null);

  const isEditMode = mode === "edit";
  const pageTitle = useMemo(() => (isEditMode ? "Edit Student Testimonial" : "Create Student Testimonial"), [isEditMode]);

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

    const fetchItem = async () => {
      setIsPageLoading(true);
      try {
        const response = await apiClient.get(`/student-testimonials/${id}`);
        const item = response.data?.data;
        if (!item) {
          showErrorToast("Student testimonial not found");
          navigate("/student-testimonials");
          return;
        }

        setForm({
          title: item.title || "",
          position: item.position || "",
          image: null,
          description: item.description || "",
        });
        setImagePreviewUrl(item.image_url || "");
      } catch (err) {
        showErrorToast(err.response?.data?.message || "Failed to load student testimonial");
        navigate("/student-testimonials");
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchItem();
  }, [id, isEditMode, navigate, showErrorToast]);

  const handleInputChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: "" }));
  };

  const handleImageSelect = (file) => {
    if (!file) return;
    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      setFormErrors((current) => ({ ...current, image: "Only image files are allowed." }));
      return;
    }
    handleInputChange("image", file);
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = "Title is required.";
    if (!form.position.trim()) nextErrors.position = "Position is required.";
    if (!form.description.trim()) nextErrors.description = "Description is required.";
    if (!isEditMode && !form.image) nextErrors.image = "Student image is required.";
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
      payload.append("position", form.position.trim());
      payload.append("description", form.description.trim());
      if (form.image) payload.append("image", form.image);

      if (isEditMode) {
        await apiClient.put(`/student-testimonials/${id}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccessToast("Student testimonial updated successfully");
      } else {
        await apiClient.post("/student-testimonials", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccessToast("Student testimonial created successfully");
      }

      navigate("/student-testimonials");
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to save student testimonial");
    } finally {
      setIsSaving(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-sm">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading student testimonial editor...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] space-y-6">
      <div>
        <Button type="button" variant="ghost" className="-ml-3 mb-2 rounded-xl px-3 text-slate-500" onClick={() => navigate("/student-testimonials")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Student Testimonials
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{pageTitle}</h1>
      </div>

      <form onSubmit={handleSave} className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Title</label>
              <Input value={form.title} onChange={(event) => handleInputChange("title", event.target.value)} className={`rounded-xl ${formErrors.title ? "border-red-300 focus-visible:ring-red-500" : ""}`} />
              <FieldError>{formErrors.title}</FieldError>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Position</label>
              <Input value={form.position} onChange={(event) => handleInputChange("position", event.target.value)} className={`rounded-xl ${formErrors.position ? "border-red-300 focus-visible:ring-red-500" : ""}`} />
              <FieldError>{formErrors.position}</FieldError>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Description</label>
              <textarea value={form.description} onChange={(event) => handleInputChange("description", event.target.value)} rows={6} className={`min-h-[160px] w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none ${formErrors.description ? "border-red-300 focus:ring-2 focus:ring-red-500" : "border-slate-200 focus:ring-2 focus:ring-primary/30"}`} />
              <FieldError>{formErrors.description}</FieldError>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Student Image</label>
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
              <p className="text-sm font-semibold text-slate-700">Upload student image</p>
            </div>
            <Input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/gif" className="hidden" onChange={(event) => handleImageSelect(event.target.files?.[0])} />
            <FieldError>{formErrors.image}</FieldError>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => navigate("/student-testimonials")}>
            Cancel
          </Button>
          <Button type="submit" className="rounded-xl" disabled={isSaving}>
            {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? "Saving..." : isEditMode ? "Update Student Testimonial" : "Create Student Testimonial"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default StudentTestimonialFormPage;
