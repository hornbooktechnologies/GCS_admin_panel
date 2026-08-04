import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactQuill from "react-quill-new";
import "react-quill-new/node_modules/quill/dist/quill.snow.css";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "../ui/button";
import { FieldError } from "../ui/field";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import useToast from "../../hooks/useToast";
import apiClient from "../../lib/utils/network-client";

const EMPTY_FORM = {
  title: "",
  top_banner: null,
  main_banners: [],
  sub_description: "",
  category: "",
  show_on_home: true,
  display_order: 0,
  description: "",
  brochure: null,
  services_intro: "",
  services_heading: "",
  services: [{ title: "" }],
};

const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
];

const ALLOWED_BROCHURE_TYPES = [...ALLOWED_IMAGE_TYPES, "application/pdf"];

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

const createBlankService = () => ({ title: "" });

const getFileNameFromUrl = (value) => {
  if (!value) return "";
  try {
    const normalized = value.split("?")[0];
    return normalized.substring(normalized.lastIndexOf("/") + 1);
  } catch (error) {
    return "";
  }
};

const SpecialityFormPage = ({ mode }) => {
  const navigate = useNavigate();
  const { specialityId } = useParams();
  const { showErrorToast, showSuccessToast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isPageLoading, setIsPageLoading] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);
  const [topBannerPreviewUrl, setTopBannerPreviewUrl] = useState("");
  const [mainBannerPreviewUrls, setMainBannerPreviewUrls] = useState([]);
  const [existingMainBanners, setExistingMainBanners] = useState([]);
  const [brochurePreviewUrl, setBrochurePreviewUrl] = useState("");
  const [brochureType, setBrochureType] = useState("");
  const [isDragOverTopBannerUpload, setIsDragOverTopBannerUpload] = useState(false);
  const [isDragOverMainBannerUpload, setIsDragOverMainBannerUpload] = useState(false);
  const [isDragOverBrochureUpload, setIsDragOverBrochureUpload] = useState(false);
  const topBannerInputRef = useRef(null);
  const mainBannerInputRef = useRef(null);
  const brochureInputRef = useRef(null);

  const isEditMode = mode === "edit";

  const pageTitle = useMemo(
    () => (isEditMode ? "Edit Speciality" : "Create Speciality"),
    [isEditMode],
  );

  useEffect(() => {
    if (!form.top_banner) return undefined;
    const objectUrl = URL.createObjectURL(form.top_banner);
    setTopBannerPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [form.top_banner]);

  useEffect(() => {
    if (!form.main_banners.length) {
      setMainBannerPreviewUrls([]);
      return undefined;
    }

    const objectUrls = form.main_banners.map((file) => URL.createObjectURL(file));
    setMainBannerPreviewUrls(objectUrls);

    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [form.main_banners]);

  useEffect(() => {
    if (!form.brochure) return undefined;
    const objectUrl = URL.createObjectURL(form.brochure);
    setBrochurePreviewUrl(objectUrl);
    setBrochureType(form.brochure.type === "application/pdf" ? "pdf" : "image");
    return () => URL.revokeObjectURL(objectUrl);
  }, [form.brochure]);

  useEffect(() => {
    if (!isEditMode) {
      setIsPageLoading(false);
      return;
    }

    const fetchSpeciality = async () => {
      setIsPageLoading(true);
      try {
        const response = await apiClient.get(`/specialities/${specialityId}`);
        const item = response.data?.data;
        if (!item) {
          showErrorToast("Speciality not found");
          navigate("/specialities");
          return;
        }

        setForm({
          title: item.title || "",
          top_banner: null,
          main_banners: [],
          sub_description: item.sub_description || "",
          category: item.category || "",
          show_on_home: item.show_on_home !== false && item.show_on_home !== 0,
          display_order: item.display_order ?? 0,
          description: item.description || "",
          brochure: null,
          services_intro: item.services_intro || "",
          services_heading: item.services_heading || "",
          services: item.services?.length
            ? item.services.map((service) => ({ title: service.title || "" }))
            : [{ title: "" }],
        });
        setTopBannerPreviewUrl(item.top_banner_url || "");
        setExistingMainBanners(item.main_banners || []);
        setBrochurePreviewUrl(item.brochure_url || "");
        setBrochureType(item.brochure_type || "");
      } catch (err) {
        showErrorToast(err.response?.data?.message || "Failed to load speciality");
        navigate("/specialities");
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchSpeciality();
  }, [isEditMode, navigate, showErrorToast, specialityId]);

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

  const handleServiceChange = (index, value) => {
    setForm((current) => ({
      ...current,
      services: current.services.map((service, serviceIndex) =>
        serviceIndex === index ? { ...service, title: value } : service,
      ),
    }));
    setFormErrors((current) => ({
      ...current,
      services: current.services?.map((item, itemIndex) =>
        itemIndex === index ? { ...item, title: "" } : item,
      ),
      services_message: "",
    }));
  };

  const handleAddService = () => {
    setForm((current) => ({
      ...current,
      services: [...current.services, createBlankService()],
    }));
  };

  const handleRemoveService = (index) => {
    setForm((current) => ({
      ...current,
      services: current.services.filter((_, serviceIndex) => serviceIndex !== index),
    }));
    setFormErrors((current) => ({
      ...current,
      services: current.services?.filter((_, serviceIndex) => serviceIndex !== index),
    }));
  };

  const hasInvalidImages = (files) => files.some((file) => !ALLOWED_IMAGE_TYPES.includes(file.type));

  const handleTopBannerSelect = (file) => {
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setFormErrors((current) => ({ ...current, top_banner: "Only image files are allowed." }));
      return;
    }
    handleInputChange("top_banner", file);
  };

  const handleMainBannerSelect = (files) => {
    const fileList = Array.from(files || []);
    if (!fileList.length) return;
    const file = fileList[0];
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setFormErrors((current) => ({ ...current, main_banners: "Only image files are allowed." }));
      return;
    }
    handleInputChange("main_banners", [file]);
  };

  const handleBrochureSelect = (file) => {
    if (!file) return;
    if (!ALLOWED_BROCHURE_TYPES.includes(file.type)) {
      setFormErrors((current) => ({ ...current, brochure: "Brochure must be a PDF or image file." }));
      return;
    }
    handleInputChange("brochure", file);
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.title.trim()) nextErrors.title = "Title is required.";
    if (!form.sub_description.trim()) nextErrors.sub_description = "Sub description is required.";
    if (!form.category) nextErrors.category = "Category is required.";
    if (!isMeaningfulHtml(form.description)) nextErrors.description = "Description is required.";
    if (!isEditMode && !form.top_banner) nextErrors.top_banner = "Top banner is required.";
    if (!isEditMode && form.main_banners.length === 0) nextErrors.main_banners = "Main department image is required.";
    if (!isEditMode && !form.brochure) nextErrors.brochure = "Brochure is required.";

    const populatedServices = form.services.filter((item) => item.title.trim());
    if (form.services.some((item) => !item.title.trim()) && populatedServices.length > 0) {
      nextErrors.services = form.services.map((item) => (!item.title.trim() ? { title: "Title is required." } : {}));
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const createFormData = () => {
    const payload = new FormData();
    payload.append("title", form.title.trim());
    payload.append("sub_description", form.sub_description.trim());
    payload.append("category", form.category);
    payload.append("show_on_home", form.show_on_home);
    payload.append("display_order", form.display_order);
    payload.append("description", form.description);
    payload.append("services_intro", form.services_intro.trim());
    payload.append("services_heading", form.services_heading.trim());
    payload.append(
      "services",
      JSON.stringify(
        form.services
          .filter((item) => item.title.trim())
          .map((item, index) => ({
            title: item.title.trim(),
            display_order: index,
          })),
      ),
    );

    if (form.top_banner) {
      payload.append("top_banner", form.top_banner);
    }

    form.main_banners.forEach((file) => {
      payload.append("main_banners", file);
    });

    if (form.brochure) {
      payload.append("brochure", form.brochure);
    }

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
        await apiClient.put(`/specialities/${specialityId}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccessToast("Speciality updated successfully");
      } else {
        await apiClient.post("/specialities", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccessToast("Speciality created successfully");
      }

      navigate("/specialities");
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to save speciality");
    } finally {
      setIsSaving(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="rounded-lg border border-white/60 bg-white/80 p-8 shadow-sm">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading speciality editor...
        </div>
      </div>
    );
  }

  const displayMainBanners =
    mainBannerPreviewUrls.length > 0
      ? mainBannerPreviewUrls.map((url) => ({ image_url: url }))
      : existingMainBanners;
  const brochureDisplayName = form.brochure?.name || getFileNameFromUrl(brochurePreviewUrl);

  return (
    <div className="max-w-[1600px] space-y-6">
      <div>
        <Button type="button" variant="ghost" className="-ml-3 mb-2 rounded-lg px-3 text-slate-500" onClick={() => navigate("/specialities")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Specialities
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{pageTitle}</h1>
      </div>

      <form onSubmit={handleSave} className="rounded-lg border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Title</label>
              <Input value={form.title} onChange={(event) => handleInputChange("title", event.target.value)} className={`rounded-lg ${formErrors.title ? "border-red-300 focus-visible:ring-red-500" : ""}`} />
              <FieldError>{formErrors.title}</FieldError>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Sub Description</label>
              <textarea
                value={form.sub_description}
                onChange={(event) => handleInputChange("sub_description", event.target.value)}
                rows={5}
                className={`min-h-[140px] w-full rounded-lg border bg-white px-4 py-3 text-sm text-slate-700 outline-none ${
                  formErrors.sub_description
                    ? "border-red-300 focus:ring-2 focus:ring-red-500"
                    : "border-slate-200 focus:ring-2 focus:ring-primary/30"
                }`}
              />
              <FieldError>{formErrors.sub_description}</FieldError>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Category</label>
              <Select value={form.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="super">Super</SelectItem>
                </SelectContent>
              </Select>
              <FieldError>{formErrors.category}</FieldError>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-semibold text-slate-700">Display Order</label>
                <Input
                  type="number"
                  min={0}
                  value={form.display_order}
                  onChange={(event) => handleInputChange("display_order", parseInt(event.target.value, 10) || 0)}
                  className="rounded-lg"
                  placeholder="0"
                />
                <p className="text-xs text-slate-400">Lower numbers appear first in the homepage carousel.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Show on Homepage</label>
                <div className="flex h-10 items-center">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={form.show_on_home}
                      onChange={(event) => handleInputChange("show_on_home", event.target.checked)}
                      className="h-4 w-4 rounded accent-primary"
                    />
                    <span className="text-sm text-slate-700">{form.show_on_home ? "Visible" : "Hidden"}</span>
                  </label>
                </div>
                <p className="text-xs text-slate-400">Show in homepage carousel.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Description</label>
              <div className={`overflow-hidden rounded-lg border bg-white ${formErrors.description ? "border-red-300" : "border-slate-200"}`}>
                <ReactQuill
                  theme="snow"
                  value={form.description}
                  onChange={(value) => handleInputChange("description", value)}
                  modules={quillModules}
                  placeholder="Write speciality description here..."
                />
              </div>
              <FieldError>{formErrors.description}</FieldError>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Services Description</label>
              <textarea
                value={form.services_intro}
                onChange={(event) => handleInputChange("services_intro", event.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Paragraph shown below the Services title"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Extra Services Heading</label>
              <Input
                value={form.services_heading}
                onChange={(event) => handleInputChange("services_heading", event.target.value)}
                className="rounded-lg"
                placeholder="Heading shown above the bullet list"
              />
            </div>

            <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/70 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Extra Services Bullet Points</h2>
                  <p className="text-sm text-slate-500">Add services that should appear as bullet points below the main services description.</p>
                </div>
                <Button type="button" variant="outline" className="rounded-lg" onClick={handleAddService}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Service
                </Button>
              </div>
              <FieldError>{formErrors.services_message}</FieldError>

              <div className="space-y-4">
                {form.services.map((service, index) => {
                  const serviceError = formErrors.services?.[index] || {};

                  return (
                    <div key={`service-${index + 1}`} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-slate-700">Service {index + 1}</h3>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-lg border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleRemoveService(index)}
                          disabled={form.services.length === 1}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Title</label>
                        <Input
                          value={service.title}
                          onChange={(event) => handleServiceChange(index, event.target.value)}
                          className={`rounded-lg ${serviceError.title ? "border-red-300 focus-visible:ring-red-500" : ""}`}
                        />
                        <FieldError>{serviceError.title}</FieldError>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Top Banner</label>
              <div
                role="button"
                tabIndex={0}
                onClick={() => topBannerInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    topBannerInputRef.current?.click();
                  }
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragOverTopBannerUpload(true);
                }}
                onDragLeave={() => setIsDragOverTopBannerUpload(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragOverTopBannerUpload(false);
                  handleTopBannerSelect(event.dataTransfer.files?.[0]);
                }}
                className={`cursor-pointer rounded-lg border border-dashed p-5 text-center transition-all ${
                  formErrors.top_banner
                    ? "border-red-300 bg-red-50/40"
                    : isDragOverTopBannerUpload
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 bg-slate-50 hover:border-primary/40 hover:bg-white"
                }`}
              >
                {topBannerPreviewUrl ? (
                  <img src={topBannerPreviewUrl} alt="Top banner preview" className="mx-auto mb-4 aspect-[16/8] w-full rounded-lg object-cover" />
                ) : (
                  <div className="mx-auto mb-4 flex aspect-[16/8] w-full items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
                <p className="text-sm font-semibold text-slate-700">Upload top banner</p>
              </div>
              <Input
                ref={topBannerInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                className="hidden"
                onChange={(event) => handleTopBannerSelect(event.target.files?.[0])}
              />
              <FieldError>{formErrors.top_banner}</FieldError>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Main Department Image</label>
              <div
                role="button"
                tabIndex={0}
                onClick={() => mainBannerInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    mainBannerInputRef.current?.click();
                  }
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragOverMainBannerUpload(true);
                }}
                onDragLeave={() => setIsDragOverMainBannerUpload(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragOverMainBannerUpload(false);
                  handleMainBannerSelect(event.dataTransfer.files);
                }}
                className={`cursor-pointer rounded-lg border border-dashed p-6 text-center transition-all ${
                  formErrors.main_banners
                    ? "border-red-300 bg-red-50/40"
                    : isDragOverMainBannerUpload
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 bg-slate-50 hover:border-primary/40 hover:bg-white"
                }`}
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-700">Upload main department image</p>
                <p className="mt-1 text-xs text-slate-500">This image appears below the page title and description. Uploading a new image will replace the current one.</p>
                {form.main_banners.length ? (
                  <p className="mt-3 text-xs font-semibold text-primary">1 image selected</p>
                ) : null}
              </div>
              <Input
                ref={mainBannerInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                className="hidden"
                onChange={(event) => handleMainBannerSelect(event.target.files)}
              />
              <FieldError>{formErrors.main_banners}</FieldError>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Main Department Image Preview</label>
              {displayMainBanners.length > 0 ? (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  <img src={displayMainBanners[0].image_url} alt="Main department image preview" className="aspect-[16/10] w-full object-cover" />
                </div>
              ) : (
                <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-slate-400">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Brochure</label>
              <div
                role="button"
                tabIndex={0}
                onClick={() => brochureInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    brochureInputRef.current?.click();
                  }
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragOverBrochureUpload(true);
                }}
                onDragLeave={() => setIsDragOverBrochureUpload(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragOverBrochureUpload(false);
                  handleBrochureSelect(event.dataTransfer.files?.[0]);
                }}
                className={`cursor-pointer rounded-lg border border-dashed p-5 text-center transition-all ${
                  formErrors.brochure
                    ? "border-red-300 bg-red-50/40"
                    : isDragOverBrochureUpload
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 bg-slate-50 hover:border-primary/40 hover:bg-white"
                }`}
              >
                {brochurePreviewUrl && brochureType === "image" ? (
                  <img src={brochurePreviewUrl} alt="Brochure preview" className="mx-auto mb-4 aspect-[16/10] w-full rounded-lg object-cover" />
                ) : (
                  <div className="mx-auto mb-4 flex aspect-[16/10] w-full flex-col items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm">
                    <FileText className="h-8 w-8" />
                    {brochureType === "pdf" ? <span className="mt-2 text-xs font-semibold">PDF selected</span> : null}
                  </div>
                )}
                <p className="text-sm font-semibold text-slate-700">Upload brochure</p>
                <p className="mt-1 text-xs text-slate-500">PDF or image file</p>
              </div>
              <Input
                ref={brochureInputRef}
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp,image/gif"
                className="hidden"
                onChange={(event) => handleBrochureSelect(event.target.files?.[0])}
              />
              <FieldError>{formErrors.brochure}</FieldError>
              {brochureDisplayName ? (
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {form.brochure ? "Selected Brochure" : "Current Brochure"}
                      </p>
                      <p className="truncate text-sm font-medium text-slate-700">{brochureDisplayName}</p>
                    </div>
                  </div>
                </div>
              ) : null}
              {brochurePreviewUrl ? (
                <a
                  href={brochurePreviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  <FileText className="mr-2 h-3.5 w-3.5" />
                  Open brochure
                  <ExternalLink className="ml-2 h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="rounded-lg" onClick={() => navigate("/specialities")}>
            Cancel
          </Button>
          <Button type="submit" className="rounded-lg" disabled={isSaving}>
            {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? "Saving..." : isEditMode ? "Update Speciality" : "Create Speciality"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SpecialityFormPage;
