import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, LoaderCircle, Plus, Save, Trash2, Upload } from "lucide-react";
import { Button } from "../ui/button";
import { FieldError } from "../ui/field";
import { Input } from "../ui/input";
import useToast from "../../hooks/useToast";
import apiClient from "../../lib/utils/network-client";

const SECTION_LABELS = {
  editorial: "Editorial",
  original_article: "Original Article",
  case_report: "Case Report",
};

const createEmptyItem = () => ({
  id: null,
  title: "",
  author: "",
  pdf: null,
  pdf_url: "",
  keepExisting: false,
});

const createEmptySections = () => ({
  editorial: [createEmptyItem()],
  original_article: [createEmptyItem()],
  case_report: [createEmptyItem()],
});

const EMPTY_FORM = {
  volume: "",
  number: "",
  duration: "",
  sections: createEmptySections(),
};

const JournalFormPage = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showErrorToast, showSuccessToast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isPageLoading, setIsPageLoading] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRefs = useRef({});

  const isEditMode = mode === "edit";
  const pageTitle = useMemo(() => (isEditMode ? "Edit Journal" : "Create Journal"), [isEditMode]);

  useEffect(() => {
    if (!isEditMode) {
      setIsPageLoading(false);
      return;
    }

    const fetchJournal = async () => {
      setIsPageLoading(true);
      try {
        const response = await apiClient.get(`/journals/${id}`);
        const item = response.data?.data;
        if (!item) {
          showErrorToast("Journal not found");
          navigate("/journals");
          return;
        }

        const nextSections = createEmptySections();
        Object.keys(nextSections).forEach((section) => {
          const sectionItems = item.entries?.[section] || [];
          nextSections[section] = sectionItems.length
            ? sectionItems.map((entry) => ({
                id: entry.id,
                title: entry.title || "",
                author: entry.author || "",
                pdf: null,
                pdf_url: entry.pdf_url || "",
                keepExisting: true,
              }))
            : [createEmptyItem()];
        });

        setForm({
          volume: item.volume || "",
          number: item.number || "",
          duration: item.duration || "",
          sections: nextSections,
        });
      } catch (err) {
        showErrorToast(err.response?.data?.message || "Failed to load journal");
        navigate("/journals");
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchJournal();
  }, [id, isEditMode, navigate, showErrorToast]);

  const setSectionError = (section, message) => {
    setFormErrors((current) => ({ ...current, [section]: message || "" }));
  };

  const handleInputChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: "" }));
  };

  const handleSectionItemChange = (section, index, field, value) => {
    setForm((current) => ({
      ...current,
      sections: {
        ...current.sections,
        [section]: current.sections[section].map((item, itemIndex) =>
          itemIndex === index ? { ...item, [field]: value } : item,
        ),
      },
    }));
    setSectionError(section, "");
  };

  const handleAddSectionItem = (section) => {
    setForm((current) => ({
      ...current,
      sections: {
        ...current.sections,
        [section]: [...current.sections[section], createEmptyItem()],
      },
    }));
  };

  const handleRemoveSectionItem = (section, index) => {
    setForm((current) => {
      const items = current.sections[section];
      const nextItems = items.length === 1 ? [createEmptyItem()] : items.filter((_, itemIndex) => itemIndex !== index);
      return {
        ...current,
        sections: {
          ...current.sections,
          [section]: nextItems,
        },
      };
    });
    setSectionError(section, "");
  };

  const handlePdfSelect = (section, index, file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setSectionError(section, "Only PDF files are allowed.");
      return;
    }

    setForm((current) => ({
      ...current,
      sections: {
        ...current.sections,
        [section]: current.sections[section].map((item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                pdf: file,
                keepExisting: false,
              }
            : item,
        ),
      },
    }));
    setSectionError(section, "");
  };

  const validateSection = (section) => {
    const items = form.sections[section] || [];
    for (const item of items) {
      if (!item.title.trim() || !item.author.trim()) {
        return `${SECTION_LABELS[section]} requires title and author for every row.`;
      }
      if (!isEditMode && !item.pdf) {
        return `${SECTION_LABELS[section]} requires a PDF for every row.`;
      }
      if (isEditMode && !item.keepExisting && !item.pdf) {
        return `${SECTION_LABELS[section]} requires a PDF for every row.`;
      }
    }
    return "";
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!form.volume.trim()) nextErrors.volume = "Volume is required.";
    if (!form.number.trim()) nextErrors.number = "Number is required.";
    if (!form.duration.trim()) nextErrors.duration = "Duration is required.";

    Object.keys(form.sections).forEach((section) => {
      const message = validateSection(section);
      if (message) {
        nextErrors[section] = message;
      }
    });

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildCreatePayload = () => {
    const payload = new FormData();
    payload.append("volume", form.volume.trim());
    payload.append("number", form.number.trim());
    payload.append("duration", form.duration.trim());

    Object.entries(form.sections).forEach(([section, items]) => {
      items.forEach((item) => {
        payload.append(`${section}_titles`, item.title.trim());
        payload.append(`${section}_authors`, item.author.trim());
        payload.append(`${section}_pdfs`, item.pdf);
      });
    });

    return payload;
  };

  const buildUpdatePayload = () => {
    const payload = new FormData();
    payload.append("volume", form.volume.trim());
    payload.append("number", form.number.trim());
    payload.append("duration", form.duration.trim());

    const entriesPayload = {};
    Object.entries(form.sections).forEach(([section, items]) => {
      entriesPayload[section] = items.map((item) => ({
        id: item.id,
        title: item.title.trim(),
        author: item.author.trim(),
        keepExisting: item.keepExisting && !item.pdf,
      }));

      items.forEach((item) => {
        if (item.pdf) {
          payload.append(`${section}_pdfs`, item.pdf);
        }
      });
    });

    payload.append("entries_payload", JSON.stringify(entriesPayload));
    return payload;
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const payload = isEditMode ? buildUpdatePayload() : buildCreatePayload();

      if (isEditMode) {
        await apiClient.put(`/journals/${id}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccessToast("Journal updated successfully");
      } else {
        await apiClient.post("/journals", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccessToast("Journal created successfully");
      }

      navigate("/journals");
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to save journal");
    } finally {
      setIsSaving(false);
    }
  };

  const renderSection = (section) => (
    <div key={section} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-800">{SECTION_LABELS[section]}</h2>
          <p className="text-xs text-slate-500">Add title, author, and PDF entries.</p>
        </div>
        <Button type="button" variant="outline" className="rounded-xl" onClick={() => handleAddSectionItem(section)}>
          <Plus className="mr-2 h-4 w-4" />
          Add More
        </Button>
      </div>

      <div className="space-y-4">
        {form.sections[section].map((item, index) => {
          const inputKey = `${section}-${index}`;
          return (
            <div key={inputKey} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Title</label>
                  <Input value={item.title} onChange={(event) => handleSectionItemChange(section, index, "title", event.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Author</label>
                  <Input value={item.author} onChange={(event) => handleSectionItemChange(section, index, "author", event.target.value)} className="rounded-xl" />
                </div>
                <div className="flex items-end justify-end">
                  <Button type="button" variant="outline" className="rounded-xl border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleRemoveSectionItem(section, index)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <label className="text-sm font-semibold text-slate-700">PDF Upload</label>
                <div role="button" tabIndex={0} onClick={() => fileInputRefs.current[inputKey]?.click()} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); fileInputRefs.current[inputKey]?.click(); } }} className="cursor-pointer rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center transition-all hover:border-primary/40 hover:bg-white">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                    <Upload className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-700">Upload PDF</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.pdf
                      ? item.pdf.name
                      : item.keepExisting && item.pdf_url
                        ? "Current PDF available"
                        : "Only PDF files are allowed"}
                  </p>
                </div>
                <Input
                  ref={(element) => {
                    fileInputRefs.current[inputKey] = element;
                  }}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(event) => handlePdfSelect(section, index, event.target.files?.[0])}
                />
                {item.keepExisting && item.pdf_url ? (
                  <a href={item.pdf_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs font-semibold text-primary">
                    <FileText className="mr-2 h-4 w-4" />
                    Open current PDF
                  </a>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <FieldError className="mt-3">{formErrors[section]}</FieldError>
    </div>
  );

  if (isPageLoading) {
    return (
      <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-sm">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading journal editor...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] space-y-6">
      <div>
        <Button type="button" variant="ghost" className="-ml-3 mb-2 rounded-xl px-3 text-slate-500" onClick={() => navigate("/journals")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Journals
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{pageTitle}</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Volume</label>
              <Input value={form.volume} onChange={(event) => handleInputChange("volume", event.target.value)} className={`rounded-xl ${formErrors.volume ? "border-red-300 focus-visible:ring-red-500" : ""}`} />
              <FieldError>{formErrors.volume}</FieldError>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Number</label>
              <Input value={form.number} onChange={(event) => handleInputChange("number", event.target.value)} className={`rounded-xl ${formErrors.number ? "border-red-300 focus-visible:ring-red-500" : ""}`} />
              <FieldError>{formErrors.number}</FieldError>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Duration</label>
              <Input value={form.duration} onChange={(event) => handleInputChange("duration", event.target.value)} className={`rounded-xl ${formErrors.duration ? "border-red-300 focus-visible:ring-red-500" : ""}`} />
              <FieldError>{formErrors.duration}</FieldError>
            </div>
          </div>
        </div>

        {Object.keys(form.sections).map(renderSection)}

        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => navigate("/journals")}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl" disabled={isSaving}>
              {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isSaving ? "Saving..." : isEditMode ? "Update Journal" : "Create Journal"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default JournalFormPage;
