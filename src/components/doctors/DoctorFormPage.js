import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactQuill from "react-quill-new";
import "react-quill-new/node_modules/quill/dist/quill.snow.css";
import { ArrowLeft, ChevronDown, Image as ImageIcon, LoaderCircle, Save, Trash2 } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { FieldError } from "../ui/field";
import { Input } from "../ui/input";
import { selectTriggerStyles } from "../ui/select";
import useToast from "../../hooks/useToast";
import apiClient from "../../lib/utils/network-client";
import { cn } from "../../lib/utils/utils";

const EMPTY_FORM = {
  name: "",
  image: null,
  experience: "",
  designation: "",
  description: "",
  is_hod: false,
  speciality_ids: [],
};

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["link", "blockquote"],
    ["clean"],
  ],
};

const isMeaningfulHtml = (html) =>
  html && html.replace(/<(.|\n)*?>/g, "").replace(/&nbsp;/g, " ").trim().length > 0;

const asString = (value) => (value === undefined || value === null ? "" : String(value));

const DoctorFormPage = ({ mode }) => {
  const navigate = useNavigate();
  const { doctorId } = useParams();
  const { showErrorToast, showSuccessToast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [specialities, setSpecialities] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [isPageLoading, setIsPageLoading] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [existingImageUrl, setExistingImageUrl] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
  const imageInputRef = useRef(null);
  const isEditMode = mode === "edit";
  const pageTitle = useMemo(() => (isEditMode ? "Edit Doctor" : "Create Doctor"), [isEditMode]);
  const imageUrlForPreview = imagePreviewUrl && (form.image || !removeImage) ? imagePreviewUrl : "";

  useEffect(() => {
    if (!form.image) return undefined;
    const objectUrl = URL.createObjectURL(form.image);
    setImagePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [form.image]);

  useEffect(() => {
    const fetchSpecialities = async () => {
      try {
        const response = await apiClient.get("/specialities");
        setSpecialities(response.data?.data?.specialities || []);
      } catch (err) {
        showErrorToast(err.response?.data?.message || "Failed to load specialities");
      }
    };

    fetchSpecialities();
  }, [showErrorToast]);

  useEffect(() => {
    if (!isEditMode) {
      setIsPageLoading(false);
      return;
    }

    const fetchDoctor = async () => {
      setIsPageLoading(true);
      try {
        const response = await apiClient.get(`/doctors/${doctorId}`);
        const item = response.data?.data;
        if (!item) {
          showErrorToast("Doctor not found");
          navigate("/doctors");
          return;
        }
        setForm({
          name: item.name || "",
          image: null,
          experience: asString(item.experience),
          designation: item.designation || "",
          description: item.description || "",
          is_hod: Boolean(item.is_hod),
          speciality_ids: item.speciality_ids || [],
        });
        setImagePreviewUrl(item.image_url || "");
        setExistingImageUrl(item.image_url || "");
        setRemoveImage(false);
      } catch (err) {
        showErrorToast(err.response?.data?.message || "Failed to load doctor");
        navigate("/doctors");
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchDoctor();
  }, [doctorId, isEditMode, navigate, showErrorToast]);

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
    setRemoveImage(false);
    handleInputChange("image", file);
  };

  const handleRemoveImage = () => {
    if (form.image) {
      handleInputChange("image", null);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
      setImagePreviewUrl(isEditMode && !removeImage ? existingImageUrl : "");
      return;
    }

    if (isEditMode) {
      setRemoveImage(true);
    }
    setImagePreviewUrl("");
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
    setFormErrors((current) => ({ ...current, image: "" }));
  };

  const toggleSpeciality = (specialityId) => {
    setForm((current) => {
      const exists = current.speciality_ids.includes(specialityId);
      return {
        ...current,
        speciality_ids: exists
          ? current.speciality_ids.filter((id) => id !== specialityId)
          : [...current.speciality_ids, specialityId],
      };
    });
    setFormErrors((current) => ({ ...current, speciality_ids: "" }));
  };

  const validateForm = () => {
    const nextErrors = {};
    const experienceValue = asString(form.experience).trim();

    if (!form.name.trim()) nextErrors.name = "Name is required.";
    if (!isEditMode && !form.image) nextErrors.image = "Image is required.";
    if (!experienceValue) nextErrors.experience = "Experience is required.";
    if (Number.isNaN(Number(experienceValue)) || Number(experienceValue) < 0) nextErrors.experience = "Experience must be 0 or more.";
    if (!form.designation.trim()) nextErrors.designation = "Designation is required.";
    if (!isMeaningfulHtml(form.description)) nextErrors.description = "Description is required.";
    if (form.speciality_ids.length === 0) nextErrors.speciality_ids = "At least one speciality is required.";
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
      payload.append("experience", String(Number(asString(form.experience).trim())));
      payload.append("designation", form.designation.trim());
      payload.append("description", form.description);
      payload.append("is_hod", String(Boolean(form.is_hod)));
      payload.append("speciality_ids", JSON.stringify(form.speciality_ids));
      if (form.image) payload.append("image", form.image);
      if (isEditMode && removeImage && !form.image) payload.append("remove_image", "true");

      if (isEditMode) {
        await apiClient.put(`/doctors/${doctorId}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccessToast("Doctor updated successfully");
      } else {
        await apiClient.post("/doctors", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccessToast("Doctor created successfully");
      }

      navigate("/doctors");
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to save doctor");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedSpecialities = specialities.filter((item) => form.speciality_ids.includes(item.id));

  if (isPageLoading) {
    return (
      <div className="rounded-lg border border-white/60 bg-white/80 p-8 shadow-sm">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading doctor editor...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] space-y-6">
      <div>
        <Button type="button" variant="ghost" className="-ml-3 mb-2 rounded-lg px-3 text-slate-500" onClick={() => navigate("/doctors")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Doctors
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{pageTitle}</h1>
      </div>

      <form onSubmit={handleSave} className="rounded-lg border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Name</label>
              <Input value={form.name} onChange={(event) => handleInputChange("name", event.target.value)} className={`rounded-lg ${formErrors.name ? "border-red-300 focus-visible:ring-red-500" : ""}`} />
              <FieldError>{formErrors.name}</FieldError>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Experience</label>
                <Input type="number" min="0" max="80" value={form.experience} onChange={(event) => handleInputChange("experience", event.target.value)} className={`rounded-lg ${formErrors.experience ? "border-red-300 focus-visible:ring-red-500" : ""}`} />
                <FieldError>{formErrors.experience}</FieldError>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Designation</label>
                <Input value={form.designation} onChange={(event) => handleInputChange("designation", event.target.value)} className={`rounded-lg ${formErrors.designation ? "border-red-300 focus-visible:ring-red-500" : ""}`} />
                <FieldError>{formErrors.designation}</FieldError>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Head Of Department</label>
              <label className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                <input type="checkbox" checked={form.is_hod} onChange={(event) => handleInputChange("is_hod", event.target.checked)} />
                Mark this doctor as HOD
              </label>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Specialities</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className={cn(selectTriggerStyles, formErrors.speciality_ids && "border-red-300 text-red-600")}>
                    <span className="min-w-0 flex-1 truncate">
                      {selectedSpecialities.length > 0
                        ? `${selectedSpecialities.length} selected`
                        : "Select specialities"}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
                  <DropdownMenuLabel>Select specialities</DropdownMenuLabel>
                  {specialities.map((item) => (
                    <DropdownMenuCheckboxItem
                      key={item.id}
                      checked={form.speciality_ids.includes(item.id)}
                      onCheckedChange={() => toggleSpeciality(item.id)}
                      onSelect={(event) => event.preventDefault()}
                    >
                      <div className="flex min-w-0 flex-col overflow-hidden">
                        <span className="truncate" title={item.title}>{item.title}</span>
                        <span className="text-xs capitalize text-slate-500">{item.category}</span>
                      </div>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <FieldError>{formErrors.speciality_ids}</FieldError>
              {selectedSpecialities.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedSpecialities.map((item) => (
                    <Badge key={item.id} variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                      {item.title}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Description</label>
              <div className={`overflow-hidden rounded-lg border bg-white ${formErrors.description ? "border-red-300" : "border-slate-200"}`}>
                <ReactQuill theme="snow" value={form.description} onChange={(value) => handleInputChange("description", value)} modules={quillModules} placeholder="Write description here..." />
              </div>
              <FieldError>{formErrors.description}</FieldError>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Image</label>
              <div role="button" tabIndex={0} onClick={() => imageInputRef.current?.click()} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); imageInputRef.current?.click(); } }} className={`cursor-pointer rounded-lg border border-dashed p-5 text-center transition-all ${formErrors.image ? "border-red-300 bg-red-50/40" : "border-slate-200 bg-slate-50 hover:border-primary/40 hover:bg-white"}`}>
                {imageUrlForPreview ? (
                  <img
                    src={imageUrlForPreview}
                    alt="Preview"
                    className="mx-auto mb-4 aspect-[16/10] w-full rounded-lg object-cover"
                    onError={() => setImagePreviewUrl("")}
                  />
                ) : (
                  <div className="mx-auto mb-4 flex aspect-[16/10] w-full items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
                <p className="text-sm font-semibold text-slate-700">Upload image</p>
              </div>
              {(imagePreviewUrl || form.image) ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-lg border-red-200 text-red-600 hover:bg-red-50"
                  onClick={handleRemoveImage}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {form.image ? "Remove selected image" : "Remove current image"}
                </Button>
              ) : null}
              {isEditMode && removeImage ? (
                <p className="text-xs font-medium text-slate-500">
                  The saved doctor image will be replaced with the default picture.
                </p>
              ) : null}
              <Input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/gif" className="hidden" onChange={(event) => handleImageSelect(event.target.files?.[0])} />
              <FieldError>{formErrors.image}</FieldError>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="rounded-lg" onClick={() => navigate("/doctors")}>Cancel</Button>
          <Button type="submit" className="rounded-lg" disabled={isSaving}>
            {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? "Saving..." : isEditMode ? "Update Doctor" : "Create Doctor"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DoctorFormPage;
