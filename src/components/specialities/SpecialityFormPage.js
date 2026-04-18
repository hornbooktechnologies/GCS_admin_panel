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
  Save,
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
  description: "",
  brochure: null,
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
          description: item.description || "",
          brochure: null,
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

  const hasInvalidImages = (files) => files.some((file) => !ALLOWED_IMAGE_TYPES.includes(file.type));

  const handleTopBannerSelect = (file) => {
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setFormErrors((current) => ({ ...current, top_banner: "Only image files are allowed." }));
      return;
    }
    handleInputChange("top_banner", file);
  };

  const handleMainBannersSelect = (files) => {
    const fileList = Array.from(files || []);
    if (!fileList.length) return;
    if (hasInvalidImages(fileList)) {
      setFormErrors((current) => ({ ...current, main_banners: "Only image files are allowed." }));
      return;
    }
    handleInputChange("main_banners", fileList);
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
    if (!isEditMode && form.main_banners.length === 0) nextErrors.main_banners = "At least one main banner is required.";
    if (!isEditMode && !form.brochure) nextErrors.brochure = "Brochure is required.";

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const createFormData = () => {
    const payload = new FormData();
    payload.append("title", form.title.trim());
    payload.append("sub_description", form.sub_description.trim());
    payload.append("category", form.category);
    payload.append("description", form.description);

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
      <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-sm">
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

  return (
    <div className="max-w-[1600px] space-y-6">
      <div>
        <Button type="button" variant="ghost" className="-ml-3 mb-2 rounded-xl px-3 text-slate-500" onClick={() => navigate("/specialities")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Specialities
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{pageTitle}</h1>
      </div>

      <form onSubmit={handleSave} className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Title</label>
              <Input value={form.title} onChange={(event) => handleInputChange("title", event.target.value)} className={`rounded-xl ${formErrors.title ? "border-red-300 focus-visible:ring-red-500" : ""}`} />
              <FieldError>{formErrors.title}</FieldError>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Sub Description</label>
              <textarea
                value={form.sub_description}
                onChange={(event) => handleInputChange("sub_description", event.target.value)}
                rows={5}
                className={`min-h-[140px] w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none ${
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
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="super">Super</SelectItem>
                </SelectContent>
              </Select>
              <FieldError>{formErrors.category}</FieldError>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Description</label>
              <div className={`overflow-hidden rounded-2xl border bg-white ${formErrors.description ? "border-red-300" : "border-slate-200"}`}>
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
                className={`cursor-pointer rounded-3xl border border-dashed p-5 text-center transition-all ${
                  formErrors.top_banner
                    ? "border-red-300 bg-red-50/40"
                    : isDragOverTopBannerUpload
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 bg-slate-50 hover:border-primary/40 hover:bg-white"
                }`}
              >
                {topBannerPreviewUrl ? (
                  <img src={topBannerPreviewUrl} alt="Top banner preview" className="mx-auto mb-4 aspect-[16/8] w-full rounded-2xl object-cover" />
                ) : (
                  <div className="mx-auto mb-4 flex aspect-[16/8] w-full items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
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
              <label className="text-sm font-semibold text-slate-700">Main Banner</label>
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
                  handleMainBannersSelect(event.dataTransfer.files);
                }}
                className={`cursor-pointer rounded-3xl border border-dashed p-6 text-center transition-all ${
                  formErrors.main_banners
                    ? "border-red-300 bg-red-50/40"
                    : isDragOverMainBannerUpload
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 bg-slate-50 hover:border-primary/40 hover:bg-white"
                }`}
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-700">Upload main banner images</p>
                <p className="mt-1 text-xs text-slate-500">Select multiple images. In edit mode, new uploads replace the current gallery.</p>
                {form.main_banners.length ? (
                  <p className="mt-3 text-xs font-semibold text-primary">Selected: {form.main_banners.length} image(s)</p>
                ) : null}
              </div>
              <Input
                ref={mainBannerInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                className="hidden"
                onChange={(event) => handleMainBannersSelect(event.target.files)}
              />
              <FieldError>{formErrors.main_banners}</FieldError>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Main Banner Preview</label>
              {displayMainBanners.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {displayMainBanners.map((item, index) => (
                    <div key={`${item.image_url}-${index}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                      <img src={item.image_url} alt={`Main banner preview ${index + 1}`} className="aspect-[4/3] w-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-48 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-slate-400">
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
                className={`cursor-pointer rounded-3xl border border-dashed p-5 text-center transition-all ${
                  formErrors.brochure
                    ? "border-red-300 bg-red-50/40"
                    : isDragOverBrochureUpload
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 bg-slate-50 hover:border-primary/40 hover:bg-white"
                }`}
              >
                {brochurePreviewUrl && brochureType === "image" ? (
                  <img src={brochurePreviewUrl} alt="Brochure preview" className="mx-auto mb-4 aspect-[16/10] w-full rounded-2xl object-cover" />
                ) : (
                  <div className="mx-auto mb-4 flex aspect-[16/10] w-full flex-col items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
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
              {brochurePreviewUrl ? (
                <a
                  href={brochurePreviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
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
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => navigate("/specialities")}>
            Cancel
          </Button>
          <Button type="submit" className="rounded-xl" disabled={isSaving}>
            {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? "Saving..." : isEditMode ? "Update Speciality" : "Create Speciality"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SpecialityFormPage;
