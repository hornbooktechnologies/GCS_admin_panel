import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, LoaderCircle, Save, Upload } from "lucide-react";
import { Button } from "../ui/button";
import { FieldError } from "../ui/field";
import { Input } from "../ui/input";
import useToast from "../../hooks/useToast";
import apiClient from "../../lib/utils/network-client";

const EMPTY_FORM = {
  title: "",
  pdf: null,
  year: "",
};

const ResultFormPage = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showErrorToast, showSuccessToast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isPageLoading, setIsPageLoading] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);
  const [existingPdfUrl, setExistingPdfUrl] = useState("");
  const pdfInputRef = useRef(null);

  const isEditMode = mode === "edit";
  const pageTitle = useMemo(() => (isEditMode ? "Edit Result" : "Create Result"), [isEditMode]);

  useEffect(() => {
    if (!isEditMode) {
      setIsPageLoading(false);
      return;
    }

    const fetchItem = async () => {
      setIsPageLoading(true);
      try {
        const response = await apiClient.get(`/results/${id}`);
        const item = response.data?.data;
        if (!item) {
          showErrorToast("Result not found");
          navigate("/results");
          return;
        }

        setForm({
          title: item.title || "",
          pdf: null,
          year: item.year ? String(item.year) : "",
        });
        setExistingPdfUrl(item.pdf_url || "");
      } catch (err) {
        showErrorToast(err.response?.data?.message || "Failed to load result");
        navigate("/results");
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
    if (!form.year.trim()) {
      nextErrors.year = "Year is required.";
    } else {
      const parsedYear = Number.parseInt(form.year, 10);
      if (Number.isNaN(parsedYear) || parsedYear < 1900 || parsedYear > 2155) {
        nextErrors.year = "Enter a valid year.";
      }
    }
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
      payload.append("year", form.year.trim());
      if (form.pdf) payload.append("pdf", form.pdf);

      if (isEditMode) {
        await apiClient.put(`/results/${id}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccessToast("Result updated successfully");
      } else {
        await apiClient.post("/results", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccessToast("Result created successfully");
      }

      navigate("/results");
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to save result");
    } finally {
      setIsSaving(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-sm">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading result editor...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] space-y-6">
      <div>
        <Button type="button" variant="ghost" className="-ml-3 mb-2 rounded-xl px-3 text-slate-500" onClick={() => navigate("/results")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Results
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
              <label className="text-sm font-semibold text-slate-700">Year</label>
              <Input type="number" min="1900" max="2155" value={form.year} onChange={(event) => handleInputChange("year", event.target.value)} className={`rounded-xl ${formErrors.year ? "border-red-300 focus-visible:ring-red-500" : ""}`} />
              <FieldError>{formErrors.year}</FieldError>
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
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => navigate("/results")}>Cancel</Button>
          <Button type="submit" className="rounded-xl" disabled={isSaving}>
            {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? "Saving..." : isEditMode ? "Update Result" : "Create Result"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ResultFormPage;
