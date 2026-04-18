import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Image as ImageIcon, LoaderCircle, Save } from "lucide-react";
import { Button } from "../ui/button";
import { FieldError } from "../ui/field";
import { Input } from "../ui/input";
import useToast from "../../hooks/useToast";
import apiClient from "../../lib/utils/network-client";

const EMPTY_FORM = {
  name: "",
  image: null,
  position: "",
  address: "",
  phone_number: "",
  email: "",
};

const VALID_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NodelOfficerFormPage = ({ mode }) => {
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
  const pageTitle = useMemo(() => (isEditMode ? "Edit Nodel Officer" : "Create Nodel Officer"), [isEditMode]);

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
        const response = await apiClient.get(`/nodel-officers/${id}`);
        const item = response.data?.data;
        if (!item) {
          showErrorToast("Nodel officer not found");
          navigate("/nodel-officers");
          return;
        }

        setForm({
          name: item.name || "",
          image: null,
          position: item.position || "",
          address: item.address || "",
          phone_number: item.phone_number || "",
          email: item.email || "",
        });
        setImagePreviewUrl(item.image_url || "");
      } catch (err) {
        showErrorToast(err.response?.data?.message || "Failed to load nodel officer");
        navigate("/nodel-officers");
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

    if (!form.name.trim()) nextErrors.name = "Name is required.";
    if (!form.position.trim()) nextErrors.position = "Position is required.";
    if (!form.address.trim()) nextErrors.address = "Address is required.";
    if (!form.phone_number.trim()) nextErrors.phone_number = "Phone number is required.";
    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }
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
      payload.append("position", form.position.trim());
      payload.append("address", form.address.trim());
      payload.append("phone_number", form.phone_number.trim());
      payload.append("email", form.email.trim());
      if (form.image) payload.append("image", form.image);

      if (isEditMode) {
        await apiClient.put(`/nodel-officers/${id}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccessToast("Nodel officer updated successfully");
      } else {
        await apiClient.post("/nodel-officers", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccessToast("Nodel officer created successfully");
      }

      navigate("/nodel-officers");
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to save nodel officer");
    } finally {
      setIsSaving(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-sm">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading nodel officer editor...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] space-y-6">
      <div>
        <Button type="button" variant="ghost" className="-ml-3 mb-2 rounded-xl px-3 text-slate-500" onClick={() => navigate("/nodel-officers")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Nodel Officers
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{pageTitle}</h1>
      </div>

      <form onSubmit={handleSave} className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Name</label>
              <Input value={form.name} onChange={(event) => handleInputChange("name", event.target.value)} className={`rounded-xl ${formErrors.name ? "border-red-300 focus-visible:ring-red-500" : ""}`} />
              <FieldError>{formErrors.name}</FieldError>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Position</label>
              <Input value={form.position} onChange={(event) => handleInputChange("position", event.target.value)} className={`rounded-xl ${formErrors.position ? "border-red-300 focus-visible:ring-red-500" : ""}`} />
              <FieldError>{formErrors.position}</FieldError>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Address</label>
              <textarea value={form.address} onChange={(event) => handleInputChange("address", event.target.value)} rows={5} className={`min-h-[140px] w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none ${formErrors.address ? "border-red-300 focus:ring-2 focus:ring-red-500" : "border-slate-200 focus:ring-2 focus:ring-primary/30"}`} />
              <FieldError>{formErrors.address}</FieldError>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                <Input value={form.phone_number} onChange={(event) => handleInputChange("phone_number", event.target.value)} className={`rounded-xl ${formErrors.phone_number ? "border-red-300 focus-visible:ring-red-500" : ""}`} />
                <FieldError>{formErrors.phone_number}</FieldError>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Email ID</label>
                <Input type="email" value={form.email} onChange={(event) => handleInputChange("email", event.target.value)} className={`rounded-xl ${formErrors.email ? "border-red-300 focus-visible:ring-red-500" : ""}`} />
                <FieldError>{formErrors.email}</FieldError>
              </div>
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
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => navigate("/nodel-officers")}>
            Cancel
          </Button>
          <Button type="submit" className="rounded-xl" disabled={isSaving}>
            {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? "Saving..." : isEditMode ? "Update Nodel Officer" : "Create Nodel Officer"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NodelOfficerFormPage;
