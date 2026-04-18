import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactQuill from "react-quill-new";
import "react-quill-new/node_modules/quill/dist/quill.snow.css";
import { ArrowLeft, Image as ImageIcon, LoaderCircle, Save } from "lucide-react";
import { Button } from "../ui/button";
import { FieldError } from "../ui/field";
import { Input } from "../ui/input";
import { useAuthStore } from "../../context/AuthContext";
import useToast from "../../hooks/useToast";
import apiClient from "../../lib/utils/network-client";

const EMPTY_FORM = {
  title: "",
  description: "",
  author_name: "",
  author_designation: "",
  blog_date: "",
  thumbnail_image: null,
  detail_image: null,
};

const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
];

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

const BlogFormPage = ({ mode }) => {
  const navigate = useNavigate();
  const { blogId } = useParams();
  const { user } = useAuthStore();
  const { showErrorToast, showSuccessToast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isPageLoading, setIsPageLoading] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState("");
  const [detailPreviewUrl, setDetailPreviewUrl] = useState("");
  const [isDragOverThumbnailUpload, setIsDragOverThumbnailUpload] = useState(false);
  const [isDragOverDetailUpload, setIsDragOverDetailUpload] = useState(false);
  const thumbnailInputRef = useRef(null);
  const detailInputRef = useRef(null);

  const isAdmin = user?.role === "admin";
  const isEditMode = mode === "edit";

  const pageTitle = useMemo(
    () => (isEditMode ? "Edit Blog" : "Create Blog"),
    [isEditMode],
  );

  useEffect(() => {
    if (!form.thumbnail_image) {
      return undefined;
    }

    const objectUrl = URL.createObjectURL(form.thumbnail_image);
    setThumbnailPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [form.thumbnail_image]);

  useEffect(() => {
    if (!form.detail_image) {
      return undefined;
    }

    const objectUrl = URL.createObjectURL(form.detail_image);
    setDetailPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [form.detail_image]);

  useEffect(() => {
    if (!isEditMode || !isAdmin) {
      setIsPageLoading(false);
      return;
    }

    const fetchBlog = async () => {
      setIsPageLoading(true);
      try {
        const response = await apiClient.get(`/blogs/${blogId}`);
        const blog = response.data?.data;

        if (!blog) {
          showErrorToast("Blog not found");
          navigate("/blogs");
          return;
        }

        setForm({
          title: blog.title || "",
          description: blog.description || "",
          author_name: blog.author_name || "",
          author_designation: blog.author_designation || "",
          blog_date: blog.blog_date ? String(blog.blog_date).slice(0, 10) : "",
          thumbnail_image: null,
          detail_image: null,
        });
        setThumbnailPreviewUrl(blog.thumbnail_image_url || "");
        setDetailPreviewUrl(blog.detail_image_url || "");
      } catch (err) {
        showErrorToast(err.response?.data?.message || "Failed to load blog");
        navigate("/blogs");
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchBlog();
  }, [blogId, isAdmin, isEditMode, navigate, showErrorToast]);

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

  const validateImageFile = (file, field) => {
    if (!file) {
      return false;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setFormErrors((current) => ({
        ...current,
        [field]: "Only JPG, PNG, GIF, or WEBP images are allowed.",
      }));
      return false;
    }

    setFormErrors((current) => ({
      ...current,
      [field]: "",
    }));
    return true;
  };

  const handleImageSelect = (field, file) => {
    if (!validateImageFile(file, field)) {
      return;
    }

    handleInputChange(field, file);
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.title.trim()) nextErrors.title = "Blog title is required.";
    if (!isMeaningfulHtml(form.description)) {
      nextErrors.description = "Blog description is required.";
    }
    if (!form.author_name.trim()) {
      nextErrors.author_name = "Author name is required.";
    }
    if (!form.author_designation.trim()) {
      nextErrors.author_designation = "Author designation is required.";
    }
    if (!form.blog_date) nextErrors.blog_date = "Blog date is required.";
    if (!isEditMode && !form.thumbnail_image) {
      nextErrors.thumbnail_image = "Thumbnail image is required.";
    }
    if (!isEditMode && !form.detail_image) {
      nextErrors.detail_image = "Detail page image is required.";
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const createFormData = () => {
    const payload = new FormData();
    payload.append("title", form.title.trim());
    payload.append("description", form.description);
    payload.append("author_name", form.author_name.trim());
    payload.append("author_designation", form.author_designation.trim());
    payload.append("blog_date", form.blog_date);

    if (form.thumbnail_image) {
      payload.append("thumbnail_image", form.thumbnail_image);
    }

    if (form.detail_image) {
      payload.append("detail_image", form.detail_image);
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
        await apiClient.put(`/blogs/${blogId}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccessToast("Blog updated successfully");
      } else {
        await apiClient.post("/blogs", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccessToast("Blog created successfully");
      }

      navigate("/blogs");
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to save blog");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{pageTitle}</h1>
        <p className="mt-2 text-sm text-slate-500">
          Blog management is only available for admin users.
        </p>
      </div>
    );
  }

  if (isPageLoading) {
    return (
      <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-sm">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading blog editor...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Button
            type="button"
            variant="ghost"
            className="-ml-3 mb-2 rounded-xl px-3 text-slate-500"
            onClick={() => navigate("/blogs")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blogs
          </Button>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {pageTitle}
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {isEditMode
              ? "Update blog content, images, and author details."
              : "Create a blog with rich content, images, and author details."}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSave}
        className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl"
      >
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Title</label>
              <Input
                value={form.title}
                onChange={(event) => handleInputChange("title", event.target.value)}
                placeholder="GCS Hospital launches new specialty clinic"
                className={`rounded-xl ${formErrors.title ? "border-red-300 focus-visible:ring-red-500" : ""}`}
              />
              <FieldError>{formErrors.title}</FieldError>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Author Name
                </label>
                <Input
                  value={form.author_name}
                  onChange={(event) =>
                    handleInputChange("author_name", event.target.value)
                  }
                  placeholder="Dr. Ananya Sharma"
                  className={`rounded-xl ${formErrors.author_name ? "border-red-300 focus-visible:ring-red-500" : ""}`}
                />
                <FieldError>{formErrors.author_name}</FieldError>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Author Designation
                </label>
                <Input
                  value={form.author_designation}
                  onChange={(event) =>
                    handleInputChange("author_designation", event.target.value)
                  }
                  placeholder="Senior Cardiologist"
                  className={`rounded-xl ${formErrors.author_designation ? "border-red-300 focus-visible:ring-red-500" : ""}`}
                />
                <FieldError>{formErrors.author_designation}</FieldError>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Date</label>
              <Input
                type="date"
                value={form.blog_date}
                onChange={(event) =>
                  handleInputChange("blog_date", event.target.value)
                }
                className={`rounded-xl ${formErrors.blog_date ? "border-red-300 focus-visible:ring-red-500" : ""}`}
              />
              <FieldError>{formErrors.blog_date}</FieldError>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Description
              </label>
              <div
                className={`overflow-hidden rounded-2xl border bg-white ${
                  formErrors.description ? "border-red-300" : "border-slate-200"
                }`}
              >
                <ReactQuill
                  theme="snow"
                  value={form.description}
                  onChange={(value) => handleInputChange("description", value)}
                  modules={quillModules}
                  placeholder="Write the full blog content here..."
                />
              </div>
              <FieldError>{formErrors.description}</FieldError>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Thumbnail Image
              </label>
              <div
                role="button"
                tabIndex={0}
                onClick={() => thumbnailInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    thumbnailInputRef.current?.click();
                  }
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragOverThumbnailUpload(true);
                }}
                onDragLeave={() => setIsDragOverThumbnailUpload(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragOverThumbnailUpload(false);
                  handleImageSelect(
                    "thumbnail_image",
                    event.dataTransfer.files?.[0],
                  );
                }}
                className={`cursor-pointer rounded-3xl border border-dashed p-5 text-center transition-all ${
                  formErrors.thumbnail_image
                    ? "border-red-300 bg-red-50/40"
                    : isDragOverThumbnailUpload
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 bg-slate-50 hover:border-primary/40 hover:bg-white"
                }`}
              >
                {thumbnailPreviewUrl ? (
                  <img
                    src={thumbnailPreviewUrl}
                    alt="Thumbnail preview"
                    className="mx-auto mb-4 aspect-[16/10] w-full rounded-2xl object-cover"
                  />
                ) : (
                  <div className="mx-auto mb-4 flex aspect-[16/10] w-full items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
                <p className="text-sm font-semibold text-slate-700">
                  Upload thumbnail image
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  JPG, PNG, GIF, or WEBP up to 5MB
                </p>
                {form.thumbnail_image ? (
                  <p className="mt-3 text-xs font-semibold text-primary">
                    Selected: {form.thumbnail_image.name}
                  </p>
                ) : null}
              </div>
              <Input
                ref={thumbnailInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                className="hidden"
                onChange={(event) =>
                  handleImageSelect("thumbnail_image", event.target.files?.[0])
                }
              />
              <FieldError>{formErrors.thumbnail_image}</FieldError>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Detail Page Image
              </label>
              <div
                role="button"
                tabIndex={0}
                onClick={() => detailInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    detailInputRef.current?.click();
                  }
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragOverDetailUpload(true);
                }}
                onDragLeave={() => setIsDragOverDetailUpload(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragOverDetailUpload(false);
                  handleImageSelect(
                    "detail_image",
                    event.dataTransfer.files?.[0],
                  );
                }}
                className={`cursor-pointer rounded-3xl border border-dashed p-5 text-center transition-all ${
                  formErrors.detail_image
                    ? "border-red-300 bg-red-50/40"
                    : isDragOverDetailUpload
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 bg-slate-50 hover:border-primary/40 hover:bg-white"
                }`}
              >
                {detailPreviewUrl ? (
                  <img
                    src={detailPreviewUrl}
                    alt="Detail preview"
                    className="mx-auto mb-4 aspect-[16/10] w-full rounded-2xl object-cover"
                  />
                ) : (
                  <div className="mx-auto mb-4 flex aspect-[16/10] w-full items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
                <p className="text-sm font-semibold text-slate-700">
                  Upload detail page image
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  JPG, PNG, GIF, or WEBP up to 5MB
                </p>
                {form.detail_image ? (
                  <p className="mt-3 text-xs font-semibold text-primary">
                    Selected: {form.detail_image.name}
                  </p>
                ) : null}
              </div>
              <Input
                ref={detailInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                className="hidden"
                onChange={(event) =>
                  handleImageSelect("detail_image", event.target.files?.[0])
                }
              />
              <FieldError>{formErrors.detail_image}</FieldError>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => navigate("/blogs")}
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
                ? "Update Blog"
                : "Create Blog"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BlogFormPage;
