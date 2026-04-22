import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Image as ImageIcon, LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { FieldError } from "../ui/field";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import useToast from "../../hooks/useToast";
import apiClient from "../../lib/utils/network-client";

const EMPTY_CAUSE = {
  title: "",
  description: "",
};

const EMPTY_FORM = {
  name: "",
  subtitle: "",
  image: null,
  potential_causes: [{ ...EMPTY_CAUSE }],
};

const VALID_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

const createBlankCause = () => ({ ...EMPTY_CAUSE });

const SympotmFormPage = ({ mode }) => {
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
  const pageTitle = useMemo(() => (isEditMode ? "Edit Symptom" : "Create Symptom"), [isEditMode]);

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

    const fetchSympotm = async () => {
      setIsPageLoading(true);
      try {
        const response = await apiClient.get(`/symptoms/${id}`);
        const item = response.data?.data;

        if (!item) {
          showErrorToast("Symptom not found");
          navigate("/symptoms");
          return;
        }

        setForm({
          name: item.name || "",
          subtitle: item.subtitle || "",
          image: null,
          potential_causes: item.potential_causes?.length
            ? item.potential_causes.map((cause) => ({
                title: cause.title || "",
                description: cause.description || "",
              }))
            : [{ ...EMPTY_CAUSE }],
        });
        setImagePreviewUrl(item.image_url || "");
      } catch (err) {
        showErrorToast(err.response?.data?.message || "Failed to load symptom");
        navigate("/symptoms");
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchSympotm();
  }, [id, isEditMode, navigate, showErrorToast]);

  const handleInputChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: "" }));
  };

  const handleCauseChange = (index, field, value) => {
    setForm((current) => ({
      ...current,
      potential_causes: current.potential_causes.map((cause, causeIndex) =>
        causeIndex === index ? { ...cause, [field]: value } : cause,
      ),
    }));
    setFormErrors((current) => ({
      ...current,
      potential_causes: current.potential_causes?.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: "" } : item,
      ),
    }));
  };

  const handleAddCause = () => {
    setForm((current) => ({
      ...current,
      potential_causes: [...current.potential_causes, createBlankCause()],
    }));
  };

  const handleRemoveCause = (index) => {
    setForm((current) => ({
      ...current,
      potential_causes: current.potential_causes.filter((_, causeIndex) => causeIndex !== index),
    }));
    setFormErrors((current) => ({
      ...current,
      potential_causes: current.potential_causes?.filter((_, causeIndex) => causeIndex !== index),
    }));
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

    if (!form.name.trim()) nextErrors.name = "Name is required.";
    if (!form.subtitle.trim()) nextErrors.subtitle = "Subtitle is required.";
    if (!isEditMode && !form.image) nextErrors.image = "Image is required.";

    const causeErrors = form.potential_causes.map((cause) => {
      const errors = {};
      if (!cause.title.trim()) errors.title = "Title is required.";
      if (!cause.description.trim()) errors.description = "Description is required.";
      return errors;
    });

    const hasCauseErrors = causeErrors.some((item) => Object.keys(item).length > 0);

    if (form.potential_causes.length === 0) {
      nextErrors.potential_causes_message = "At least one potential cause is required.";
    } else if (hasCauseErrors) {
      nextErrors.potential_causes = causeErrors;
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
      payload.append("name", form.name.trim());
      payload.append("subtitle", form.subtitle.trim());
      payload.append(
        "potential_causes",
        JSON.stringify(
          form.potential_causes.map((cause) => ({
            title: cause.title.trim(),
            description: cause.description.trim(),
          })),
        ),
      );
      if (form.image) payload.append("image", form.image);

      if (isEditMode) {
        await apiClient.put(`/symptoms/${id}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccessToast("Symptom updated successfully");
      } else {
        await apiClient.post("/symptoms", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccessToast("Symptom created successfully");
      }

      navigate("/symptoms");
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to save symptom");
    } finally {
      setIsSaving(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-sm">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading symptom editor...
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
          className="-ml-3 mb-2 rounded-xl px-3 text-slate-500"
          onClick={() => navigate("/symptoms")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Symptoms
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{pageTitle}</h1>
      </div>

      <form
        onSubmit={handleSave}
        className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl"
      >
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Name</label>
              <Input
                value={form.name}
                onChange={(event) => handleInputChange("name", event.target.value)}
                className={`rounded-xl ${formErrors.name ? "border-red-300 focus-visible:ring-red-500" : ""}`}
              />
              <FieldError>{formErrors.name}</FieldError>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Subtitle</label>
              <Textarea
                value={form.subtitle}
                onChange={(event) => handleInputChange("subtitle", event.target.value)}
                className={`min-h-[110px] rounded-xl ${formErrors.subtitle ? "border-red-300 focus-visible:ring-red-500" : ""}`}
              />
              <FieldError>{formErrors.subtitle}</FieldError>
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
                <img
                  src={imagePreviewUrl}
                  alt="Preview"
                  className="mx-auto mb-4 aspect-[16/10] w-full rounded-2xl object-cover"
                />
              ) : (
                <div className="mx-auto mb-4 flex aspect-[16/10] w-full items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}
              <p className="text-sm font-semibold text-slate-700">Upload image</p>
            </div>
            <Input
              ref={imageInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              className="hidden"
              onChange={(event) => handleImageSelect(event.target.files?.[0])}
            />
            <FieldError>{formErrors.image}</FieldError>
          </div>
        </div>

        <div className="mt-8 space-y-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Potential Causes</h2>
              <p className="text-sm text-slate-500">Add one or more cause blocks with a title and description.</p>
            </div>
            <Button type="button" variant="outline" className="rounded-xl" onClick={handleAddCause}>
              <Plus className="mr-2 h-4 w-4" />
              Add Cause
            </Button>
          </div>
          <FieldError>{formErrors.potential_causes_message}</FieldError>

          <div className="space-y-4">
            {form.potential_causes.map((cause, index) => {
              const causeError = formErrors.potential_causes?.[index] || {};

              return (
                <div key={`cause-${index + 1}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-slate-700">Cause {index + 1}</h3>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => handleRemoveCause(index)}
                      disabled={form.potential_causes.length === 1}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Title</label>
                      <Input
                        value={cause.title}
                        onChange={(event) => handleCauseChange(index, "title", event.target.value)}
                        className={`rounded-xl ${causeError.title ? "border-red-300 focus-visible:ring-red-500" : ""}`}
                      />
                      <FieldError>{causeError.title}</FieldError>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Description</label>
                      <Textarea
                        value={cause.description}
                        onChange={(event) => handleCauseChange(index, "description", event.target.value)}
                        className={`min-h-[120px] rounded-xl ${causeError.description ? "border-red-300 focus-visible:ring-red-500" : ""}`}
                      />
                      <FieldError>{causeError.description}</FieldError>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => navigate("/symptoms")}>
            Cancel
          </Button>
          <Button type="submit" className="rounded-xl" disabled={isSaving}>
            {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? "Saving..." : isEditMode ? "Update Symptom" : "Create Symptom"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SympotmFormPage;
