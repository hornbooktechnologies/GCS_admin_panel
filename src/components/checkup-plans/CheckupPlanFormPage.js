import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Image as ImageIcon, LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { FieldError } from "../ui/field";
import { Input } from "../ui/input";
import useToast from "../../hooks/useToast";
import apiClient from "../../lib/utils/network-client";

const EMPTY_FORM = {
  name: "",
  price: "",
  image: null,
  test_names: [""],
};

const VALID_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

const CheckupPlanFormPage = ({ mode }) => {
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
  const pageTitle = useMemo(() => (isEditMode ? "Edit Checkup Plan" : "Create Checkup Plan"), [isEditMode]);

  useEffect(() => {
    if (!form.image) {
      return undefined;
    }

    const objectUrl = URL.createObjectURL(form.image);
    setImagePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [form.image]);

  useEffect(() => {
    if (!isEditMode) {
      setIsPageLoading(false);
      return;
    }

    const fetchPlan = async () => {
      setIsPageLoading(true);
      try {
        const response = await apiClient.get(`/checkup-plans/${id}`);
        const item = response.data?.data;
        if (!item) {
          showErrorToast("Checkup plan not found");
          navigate("/checkup-plans");
          return;
        }

        setForm({
          name: item.name || "",
          price: item.price !== undefined ? String(item.price) : "",
          image: null,
          test_names: item.test_names?.length ? item.test_names : [""],
        });
        setImagePreviewUrl(item.image_url || "");
      } catch (err) {
        showErrorToast(err.response?.data?.message || "Failed to load checkup plan");
        navigate("/checkup-plans");
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchPlan();
  }, [id, isEditMode, navigate, showErrorToast]);

  const handleInputChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: "" }));
  };

  const handleTestNameChange = (index, value) => {
    setForm((current) => ({
      ...current,
      test_names: current.test_names.map((item, itemIndex) => (itemIndex === index ? value : item)),
    }));
    setFormErrors((current) => ({ ...current, test_names: "" }));
  };

  const handleAddTestName = () => {
    setForm((current) => ({ ...current, test_names: [...current.test_names, ""] }));
  };

  const handleRemoveTestName = (index) => {
    setForm((current) => {
      if (current.test_names.length === 1) {
        return { ...current, test_names: [""] };
      }

      return {
        ...current,
        test_names: current.test_names.filter((_, itemIndex) => itemIndex !== index),
      };
    });
    setFormErrors((current) => ({ ...current, test_names: "" }));
  };

  const handleImageSelect = (file) => {
    if (!file) {
      return;
    }

    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      setFormErrors((current) => ({ ...current, image: "Only image files are allowed." }));
      return;
    }

    handleInputChange("image", file);
  };

  const validateForm = () => {
    const nextErrors = {};
    const cleanedTests = form.test_names.map((item) => item.trim()).filter(Boolean);

    if (!form.name.trim()) nextErrors.name = "Name is required.";
    if (!form.price.trim()) {
      nextErrors.price = "Price is required.";
    } else if (Number.isNaN(Number.parseFloat(form.price)) || Number.parseFloat(form.price) < 0) {
      nextErrors.price = "Price must be a valid positive number.";
    }
    if (!isEditMode && !form.image) nextErrors.image = "Image is required.";
    if (cleanedTests.length === 0) nextErrors.test_names = "At least one test name is required.";

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const payload = new FormData();
      const cleanedTests = form.test_names.map((item) => item.trim()).filter(Boolean);

      payload.append("name", form.name.trim());
      payload.append("price", form.price.trim());
      cleanedTests.forEach((item) => payload.append("test_names", item));
      if (form.image) payload.append("image", form.image);

      if (isEditMode) {
        await apiClient.put(`/checkup-plans/${id}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccessToast("Checkup plan updated successfully");
      } else {
        await apiClient.post("/checkup-plans", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccessToast("Checkup plan created successfully");
      }

      navigate("/checkup-plans");
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to save checkup plan");
    } finally {
      setIsSaving(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-sm">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading checkup plan editor...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] space-y-6">
      <div>
        <Button type="button" variant="ghost" className="-ml-3 mb-2 rounded-xl px-3 text-slate-500" onClick={() => navigate("/checkup-plans")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Checkup Plans
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{pageTitle}</h1>
      </div>

      <form onSubmit={handleSave} className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Name</label>
              <Input value={form.name} onChange={(event) => handleInputChange("name", event.target.value)} className={`rounded-xl ${formErrors.name ? "border-red-300 focus-visible:ring-red-500" : ""}`} />
              <FieldError>{formErrors.name}</FieldError>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Price</label>
              <Input type="number" min="0" step="0.01" value={form.price} onChange={(event) => handleInputChange("price", event.target.value)} className={`rounded-xl ${formErrors.price ? "border-red-300 focus-visible:ring-red-500" : ""}`} />
              <FieldError>{formErrors.price}</FieldError>
            </div>

            <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">Test Names</h2>
                  <p className="text-xs text-slate-500">Add one or more test names for this plan.</p>
                </div>
                <Button type="button" variant="outline" className="rounded-xl" onClick={handleAddTestName}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add More
                </Button>
              </div>

              <div className="space-y-3">
                {form.test_names.map((testName, index) => (
                  <div key={`${index}-${testName}`} className="flex items-start gap-3">
                    <Input
                      value={testName}
                      onChange={(event) => handleTestNameChange(index, event.target.value)}
                      placeholder={`Test name ${index + 1}`}
                      className={`rounded-xl ${formErrors.test_names ? "border-red-300 focus-visible:ring-red-500" : ""}`}
                    />
                    <Button type="button" variant="outline" className="rounded-xl border-red-200 px-3 text-red-600 hover:bg-red-50" onClick={() => handleRemoveTestName(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <FieldError>{formErrors.test_names}</FieldError>
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

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => navigate("/checkup-plans")}>
            Cancel
          </Button>
          <Button type="submit" className="rounded-xl" disabled={isSaving}>
            {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? "Saving..." : isEditMode ? "Update Checkup Plan" : "Create Checkup Plan"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CheckupPlanFormPage;
