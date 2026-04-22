import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  LoaderCircle,
  Save,
  Upload,
} from "lucide-react";
import { Button } from "../ui/button";
import { FieldError } from "../ui/field";
import { Input } from "../ui/input";
import { useAuthStore } from "../../context/AuthContext";
import { hasPermission } from "../../lib/utils/permissions";
import useToast from "../../hooks/useToast";
import apiClient from "../../lib/utils/network-client";

const EMPTY_FORM = {
  title: "",
  year: "",
  photo: null,
  attachment: null,
};

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];
const ALLOWED_PDF_TYPES = ["application/pdf"];

const NewsletterFormPage = ({ mode }) => {
  const navigate = useNavigate();
  const { newsletterId } = useParams();
  const { user } = useAuthStore();
  const { showErrorToast, showSuccessToast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isPageLoading, setIsPageLoading] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState("");
  const [existingPhotoUrl, setExistingPhotoUrl] = useState("");
  const [existingAttachment, setExistingAttachment] = useState(null);
  const photoInputRef = useRef(null);
  const attachmentInputRef = useRef(null);

  const isEditMode = mode === "edit";
  const isAdmin = hasPermission(user, "newsletters", isEditMode ? "edit" : "create");

  const pageTitle = useMemo(
    () => (isEditMode ? "Edit Newsletter" : "Create Newsletter"),
    [isEditMode],
  );

  useEffect(() => {
    if (!form.photo) {
      return undefined;
    }

    const objectUrl = URL.createObjectURL(form.photo);
    setPhotoPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [form.photo]);

  useEffect(() => {
    if (!form.attachment || ALLOWED_PDF_TYPES.includes(form.attachment.type)) {
      setAttachmentPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(form.attachment);
    setAttachmentPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [form.attachment]);

  useEffect(() => {
    if (!isEditMode || !isAdmin) {
      setIsPageLoading(false);
      return;
    }

    const fetchNewsletter = async () => {
      setIsPageLoading(true);
      try {
        const response = await apiClient.get(`/newsletters/${newsletterId}`);
        const newsletter = response.data?.data;

        if (!newsletter) {
          showErrorToast("Newsletter not found");
          navigate("/newsletters");
          return;
        }

        setForm({
          title: newsletter.title || "",
          year: newsletter.year ? String(newsletter.year) : "",
          photo: null,
          attachment: null,
        });
        setPhotoPreviewUrl(newsletter.photo_url || "");
        setExistingPhotoUrl(newsletter.photo_url || "");
        setExistingAttachment({
          url: newsletter.attachment_url,
          type: newsletter.attachment_type,
        });
      } catch (err) {
        showErrorToast(err.response?.data?.message || "Failed to load newsletter");
        navigate("/newsletters");
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchNewsletter();
  }, [newsletterId, isAdmin, isEditMode, navigate, showErrorToast]);

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

  const handlePhotoSelect = (file) => {
    if (!file) {
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setFormErrors((current) => ({
        ...current,
        photo: "Only JPG, PNG, GIF, or WEBP images are allowed.",
      }));
      return;
    }

    handleInputChange("photo", file);
  };

  const handleAttachmentSelect = (file) => {
    if (!file) {
      return;
    }

    const isPdf = ALLOWED_PDF_TYPES.includes(file.type);
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);

    if (!isPdf && !isImage) {
      setFormErrors((current) => ({
        ...current,
        attachment: "Attachment must be a PDF or image file.",
      }));
      return;
    }

    handleInputChange("attachment", file);
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.title.trim()) nextErrors.title = "Newsletter title is required.";
    if (!form.year.trim()) {
      nextErrors.year = "Year is required.";
    } else if (!/^\d{4}$/.test(form.year.trim())) {
      nextErrors.year = "Enter a valid 4-digit year.";
    }
    if (!isEditMode && !form.photo) {
      nextErrors.photo = "Photo is required.";
    }
    if (!isEditMode && !form.attachment) {
      nextErrors.attachment = "Attachment is required.";
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const payload = new FormData();
      payload.append("title", form.title.trim());
      payload.append("year", form.year.trim());

      if (form.photo) {
        payload.append("photo", form.photo);
      }

      if (form.attachment) {
        payload.append("attachment", form.attachment);
      }

      if (isEditMode) {
        await apiClient.put(`/newsletters/${newsletterId}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccessToast("Newsletter updated successfully");
      } else {
        await apiClient.post("/newsletters", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccessToast("Newsletter created successfully");
      }

      navigate("/newsletters");
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to save newsletter");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{pageTitle}</h1>
        <p className="mt-2 text-sm text-slate-500">
          Newsletter management is only available for admin users.
        </p>
      </div>
    );
  }

  if (isPageLoading) {
    return (
      <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-sm">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading newsletter editor...
        </div>
      </div>
    );
  }

  const attachmentLabel = form.attachment
    ? form.attachment.name
    : existingAttachment?.url
      ? existingAttachment.type === "pdf"
        ? "Current PDF available"
        : "Current image available"
      : "No attachment uploaded";

  return (
    <div className="max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Button
            type="button"
            variant="ghost"
            className="-ml-3 mb-2 rounded-xl px-3 text-slate-500"
            onClick={() => navigate("/newsletters")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Newsletters
          </Button>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {pageTitle}
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Manage newsletter title, photo, attachment, and year.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSave}
        className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl"
      >
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Title</label>
              <Input
                value={form.title}
                onChange={(event) => handleInputChange("title", event.target.value)}
                placeholder="Hospital Newsletter Q1"
                className={`rounded-xl ${formErrors.title ? "border-red-300 focus-visible:ring-red-500" : ""}`}
              />
              <FieldError>{formErrors.title}</FieldError>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Year</label>
              <Input
                value={form.year}
                onChange={(event) => handleInputChange("year", event.target.value)}
                placeholder="2026"
                className={`rounded-xl ${formErrors.year ? "border-red-300 focus-visible:ring-red-500" : ""}`}
              />
              <FieldError>{formErrors.year}</FieldError>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Photo</label>
              <div
                role="button"
                tabIndex={0}
                onClick={() => photoInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    photoInputRef.current?.click();
                  }
                }}
                className={`cursor-pointer rounded-3xl border border-dashed p-5 text-center transition-all ${
                  formErrors.photo
                    ? "border-red-300 bg-red-50/40"
                    : "border-slate-200 bg-slate-50 hover:border-primary/40 hover:bg-white"
                }`}
              >
                {photoPreviewUrl ? (
                  <img
                    src={photoPreviewUrl}
                    alt="Newsletter photo preview"
                    className="mx-auto mb-4 aspect-[16/10] w-full rounded-2xl object-cover"
                  />
                ) : (
                  <div className="mx-auto mb-4 flex aspect-[16/10] w-full items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
                <p className="text-sm font-semibold text-slate-700">Upload photo</p>
                <p className="mt-1 text-xs text-slate-500">
                  JPG, PNG, GIF, or WEBP up to 10MB
                </p>
              </div>
              <Input
                ref={photoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                className="hidden"
                onChange={(event) => handlePhotoSelect(event.target.files?.[0])}
              />
              <FieldError>{formErrors.photo}</FieldError>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Attachment
              </label>
              <div
                role="button"
                tabIndex={0}
                onClick={() => attachmentInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    attachmentInputRef.current?.click();
                  }
                }}
                className={`cursor-pointer rounded-3xl border border-dashed p-6 text-center transition-all ${
                  formErrors.attachment
                    ? "border-red-300 bg-red-50/40"
                    : "border-slate-200 bg-slate-50 hover:border-primary/40 hover:bg-white"
                }`}
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-700">
                  Upload image or PDF
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Supported: PDF, JPG, PNG, GIF, WEBP up to 10MB
                </p>
                <p className="mt-3 text-xs font-semibold text-primary">
                  {attachmentLabel}
                </p>
              </div>
              <Input
                ref={attachmentInputRef}
                type="file"
                accept="application/pdf,image/jpeg,image/jpg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(event) =>
                  handleAttachmentSelect(event.target.files?.[0])
                }
              />
              <FieldError>{formErrors.attachment}</FieldError>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Current Attachment
              </label>
              <div className="flex min-h-48 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6">
                {form.attachment ? (
                  ALLOWED_PDF_TYPES.includes(form.attachment.type) ? (
                    <div className="text-center text-slate-500">
                      <FileText className="mx-auto h-8 w-8" />
                      <p className="mt-3 text-sm font-semibold">{form.attachment.name}</p>
                    </div>
                  ) : (
                    <img
                      src={attachmentPreviewUrl}
                      alt="Attachment preview"
                      className="max-h-56 rounded-2xl object-contain"
                    />
                  )
                ) : existingAttachment?.url ? (
                  existingAttachment.type === "pdf" ? (
                    <a
                      href={existingAttachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-center text-slate-500"
                    >
                      <FileText className="mx-auto h-8 w-8" />
                      <p className="mt-3 text-sm font-semibold">Open current PDF</p>
                    </a>
                  ) : (
                    <img
                      src={existingAttachment.url}
                      alt="Current attachment"
                      className="max-h-56 rounded-2xl object-contain"
                    />
                  )
                ) : (
                  <div className="text-slate-400">
                    <FileText className="mx-auto h-8 w-8" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => navigate("/newsletters")}
          >
            Cancel
          </Button>
          <Button type="submit" className="rounded-xl" disabled={isSaving}>
            {isSaving ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSaving
              ? "Saving..."
              : isEditMode
                ? "Update Newsletter"
                : "Create Newsletter"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewsletterFormPage;
