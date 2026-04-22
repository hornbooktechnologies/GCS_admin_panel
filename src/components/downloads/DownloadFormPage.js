import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Image as ImageIcon, LoaderCircle, Save, Upload } from "lucide-react";
import { Button } from "../ui/button";
import { FieldError } from "../ui/field";
import { Input } from "../ui/input";
import { useAuthStore } from "../../context/AuthContext";
import { hasPermission } from "../../lib/utils/permissions";
import useToast from "../../hooks/useToast";
import apiClient from "../../lib/utils/network-client";

const EMPTY_FORM = { title: "", image: null, pdf: null };

const DownloadFormPage = ({ mode }) => {
  const navigate = useNavigate();
  const { downloadId } = useParams();
  const { user } = useAuthStore();
  const { showErrorToast, showSuccessToast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isPageLoading, setIsPageLoading] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [existingPdfUrl, setExistingPdfUrl] = useState("");
  const imageInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  const isEditMode = mode === "edit";
  const isAdmin = hasPermission(user, "downloads", isEditMode ? "edit" : "create");
  const pageTitle = useMemo(
    () => (isEditMode ? "Edit Download" : "Create Download"),
    [isEditMode],
  );

  useEffect(() => {
    if (!form.image) {
      return undefined;
    }

    const objectUrl = URL.createObjectURL(form.image);
    setImagePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [form.image]);

  useEffect(() => {
    if (!isEditMode || !isAdmin) {
      setIsPageLoading(false);
      return;
    }

    const fetchDownload = async () => {
      setIsPageLoading(true);
      try {
        const response = await apiClient.get(`/downloads/${downloadId}`);
        const item = response.data?.data;

        if (!item) {
          showErrorToast("Download not found");
          navigate("/downloads");
          return;
        }

        setForm({ title: item.title || "", image: null, pdf: null });
        setImagePreviewUrl(item.image_url || "");
        setExistingPdfUrl(item.pdf_url || "");
      } catch (err) {
        showErrorToast(err.response?.data?.message || "Failed to load download");
        navigate("/downloads");
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchDownload();
  }, [downloadId, isAdmin, isEditMode, navigate, showErrorToast]);

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

  const handlePdfSelect = (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setFormErrors((current) => ({ ...current, pdf: "Only PDF files are allowed." }));
      return;
    }
    handleInputChange("pdf", file);
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = "Title is required.";
    if (!isEditMode && !form.image) nextErrors.image = "Image is required.";
    if (!isEditMode && !form.pdf) nextErrors.pdf = "PDF is required.";
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
      if (form.image) payload.append("image", form.image);
      if (form.pdf) payload.append("pdf", form.pdf);

      if (isEditMode) {
        await apiClient.put(`/downloads/${downloadId}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccessToast("Download updated successfully");
      } else {
        await apiClient.post("/downloads", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccessToast("Download created successfully");
      }

      navigate("/downloads");
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to save download");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{pageTitle}</h1>
        <p className="mt-2 text-sm text-slate-500">Download management is only available for admin users.</p>
      </div>
    );
  }

  if (isPageLoading) {
    return (
      <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-sm">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading download editor...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] space-y-6">
      <div>
        <Button type="button" variant="ghost" className="-ml-3 mb-2 rounded-xl px-3 text-slate-500" onClick={() => navigate("/downloads")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Downloads
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{pageTitle}</h1>
      </div>

      <form onSubmit={handleSave} className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Title</label>
              <Input value={form.title} onChange={(event) => handleInputChange("title", event.target.value)} className={`rounded-xl ${formErrors.title ? "border-red-300 focus-visible:ring-red-500" : ""}`} />
              <FieldError>{formErrors.title}</FieldError>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Image Upload</label>
              <div role="button" tabIndex={0} onClick={() => imageInputRef.current?.click()} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); imageInputRef.current?.click(); } }} className={`cursor-pointer rounded-3xl border border-dashed p-5 text-center transition-all ${formErrors.image ? "border-red-300 bg-red-50/40" : "border-slate-200 bg-slate-50 hover:border-primary/40 hover:bg-white"}`}>
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

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">PDF Upload</label>
              <div role="button" tabIndex={0} onClick={() => pdfInputRef.current?.click()} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); pdfInputRef.current?.click(); } }} className={`cursor-pointer rounded-3xl border border-dashed p-6 text-center transition-all ${formErrors.pdf ? "border-red-300 bg-red-50/40" : "border-slate-200 bg-slate-50 hover:border-primary/40 hover:bg-white"}`}>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-700">Upload PDF</p>
                <p className="mt-1 text-xs text-slate-500">{form.pdf ? form.pdf.name : existingPdfUrl ? "Current PDF available" : "Only PDF files are allowed"}</p>
              </div>
              <Input ref={pdfInputRef} type="file" accept="application/pdf" className="hidden" onChange={(event) => handlePdfSelect(event.target.files?.[0])} />
              <FieldError>{formErrors.pdf}</FieldError>
            </div>

            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
              {existingPdfUrl ? (
                <a href={existingPdfUrl} target="_blank" rel="noreferrer" className="inline-flex items-center text-sm font-semibold text-primary">
                  <FileText className="mr-2 h-4 w-4" />
                  Open current PDF
                </a>
              ) : (
                <FileText className="mx-auto h-8 w-8" />
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => navigate("/downloads")}>Cancel</Button>
          <Button type="submit" className="rounded-xl" disabled={isSaving}>
            {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? "Saving..." : isEditMode ? "Update Download" : "Create Download"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DownloadFormPage;
