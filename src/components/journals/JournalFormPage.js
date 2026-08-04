import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Eye, FileText, LoaderCircle, Plus, Save, Trash2, Upload } from "lucide-react";
import { Button } from "../ui/button";
import { FieldError } from "../ui/field";
import { Input } from "../ui/input";
import useToast from "../../hooks/useToast";
import apiClient from "../../lib/utils/network-client";

const SECTION_LABELS = {
  editorial: "Editorial",
  review_article: "Review Article",
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
  editorial: [],
  review_article: [],
  original_article: [],
  case_report: [],
});

const EMPTY_FORM = {
  volume: "",
  number: "",
  duration: "",
  issue_pdf: null,
  issue_pdf_url: "",
  remove_issue_pdf: false,
  sections: createEmptySections(),
};

const PdfUploadedStatus = ({ file, url, onDelete }) => {
  const handleView = () => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      window.open(objectUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
      return;
    }

    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm">
          <FileText className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-emerald-800">PDF uploaded</p>
          <p className="truncate text-xs text-emerald-700/80">
            {file?.name || "Current saved PDF"}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="rounded-lg bg-white" onClick={handleView}>
          <Eye className="mr-2 h-4 w-4" />
          View
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-lg border-red-200 bg-white text-red-600 hover:bg-red-50"
          onClick={onDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  );
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
  const issuePdfInputRef = useRef(null);

  const isEditMode = mode === "edit";
  const pageTitle = useMemo(() => (isEditMode ? "Edit Journal Issue" : "Create Journal Issue"), [isEditMode]);

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
          nextSections[section] = sectionItems.map((entry) => ({
                id: entry.id,
                title: entry.title || "",
                author: entry.author || "",
                pdf: null,
                pdf_url: entry.pdf_url || "",
                keepExisting: true,
              }));
        });

        setForm({
          volume: item.volume || "",
          number: item.number || "",
          duration: item.duration || "",
          issue_pdf: null,
          issue_pdf_url: item.issue_pdf_url || "",
          remove_issue_pdf: false,
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
      const nextItems = items.filter((_, itemIndex) => itemIndex !== index);
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

  const handleIssuePdfSelect = (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setFormErrors((current) => ({ ...current, content: "Only PDF files are allowed." }));
      return;
    }

    setForm((current) => ({ ...current, issue_pdf: file }));
    setFormErrors((current) => ({ ...current, content: "" }));
  };

  const handleDeleteEntryPdf = (section, index) => {
    setForm((current) => ({
      ...current,
      sections: {
        ...current.sections,
        [section]: current.sections[section].map((item, itemIndex) => {
          if (itemIndex !== index) return item;
          if (item.pdf) {
            return {
              ...item,
              pdf: null,
              keepExisting: Boolean(item.pdf_url),
            };
          }
          return { ...item, pdf: null, pdf_url: "", keepExisting: false };
        }),
      },
    }));
    if (fileInputRefs.current[`${section}-${index}`]) {
      fileInputRefs.current[`${section}-${index}`].value = "";
    }
    setSectionError(section, "");
  };

  const handleDeleteIssuePdf = () => {
    setForm((current) => {
      if (current.issue_pdf) {
        return { ...current, issue_pdf: null };
      }
      return {
        ...current,
        issue_pdf: null,
        issue_pdf_url: "",
        remove_issue_pdf: true,
      };
    });
    if (issuePdfInputRef.current) {
      issuePdfInputRef.current.value = "";
    }
    setFormErrors((current) => ({ ...current, content: "" }));
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

    const hasEntries = Object.values(form.sections).some((items) => items.length > 0);
    if (!form.issue_pdf && !form.issue_pdf_url && !hasEntries) {
      nextErrors.content = "Add a full issue PDF or at least one journal entry.";
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildCreatePayload = () => {
    const payload = new FormData();
    payload.append("volume", form.volume.trim());
    payload.append("number", form.number.trim());
    payload.append("duration", form.duration.trim());
    if (form.issue_pdf) {
      payload.append("issue_pdf", form.issue_pdf);
    }
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
    if (form.issue_pdf) {
      payload.append("issue_pdf", form.issue_pdf);
    }
    if (form.remove_issue_pdf) {
      payload.append("remove_issue_pdf", "true");
    }

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
    <div key={section} className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-800">{SECTION_LABELS[section]}</h2>
          <p className="text-xs text-slate-500">Add title, author, and PDF entries.</p>
        </div>
        <Button type="button" variant="outline" className="rounded-lg" onClick={() => handleAddSectionItem(section)}>
          <Plus className="mr-2 h-4 w-4" />
          Add More
        </Button>
      </div>

      <div className="space-y-4">
        {form.sections[section].length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
            No {SECTION_LABELS[section].toLowerCase()} entries added.
          </div>
        ) : null}
        {form.sections[section].map((item, index) => {
          const inputKey = `${section}-${index}`;
          const hasPdf = Boolean(item.pdf || item.pdf_url);
          return (
            <div key={inputKey} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Title</label>
                  <Input value={item.title} onChange={(event) => handleSectionItemChange(section, index, "title", event.target.value)} className="rounded-lg" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Author</label>
                  <Input value={item.author} onChange={(event) => handleSectionItemChange(section, index, "author", event.target.value)} className="rounded-lg" />
                </div>
                <div className="flex items-end justify-end">
                  <Button type="button" variant="outline" className="rounded-lg border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleRemoveSectionItem(section, index)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <label className="text-sm font-semibold text-slate-700">PDF Upload</label>
                <div
                  role="button"
                  tabIndex={hasPdf ? -1 : 0}
                  aria-disabled={hasPdf}
                  onClick={() => {
                    if (!hasPdf) fileInputRefs.current[inputKey]?.click();
                  }}
                  onKeyDown={(event) => {
                    if (!hasPdf && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      fileInputRefs.current[inputKey]?.click();
                    }
                  }}
                  className={`rounded-lg border border-dashed p-4 text-center transition-all ${
                    hasPdf
                      ? "cursor-not-allowed border-slate-200 bg-slate-100 opacity-60"
                      : "cursor-pointer border-slate-200 bg-slate-50 hover:border-primary/40 hover:bg-white"
                  }`}
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
                    <Upload className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    {hasPdf ? "PDF upload disabled" : "Upload PDF"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {hasPdf ? "Use View or Delete below" : "Only PDF files are allowed"}
                  </p>
                </div>
                <Input
                  ref={(element) => {
                    fileInputRefs.current[inputKey] = element;
                  }}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  disabled={hasPdf}
                  onChange={(event) => handlePdfSelect(section, index, event.target.files?.[0])}
                />
                {hasPdf ? (
                  <PdfUploadedStatus
                    file={item.pdf}
                    url={item.pdf_url}
                    onDelete={() => handleDeleteEntryPdf(section, index)}
                  />
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
      <div className="rounded-lg border border-white/60 bg-white/80 p-8 shadow-sm">
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
        <Button type="button" variant="ghost" className="-ml-3 mb-2 rounded-lg px-3 text-slate-500" onClick={() => navigate("/journals")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Journal Issues
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{pageTitle}</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-lg border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Volume</label>
              <Input value={form.volume} onChange={(event) => handleInputChange("volume", event.target.value)} className={`rounded-lg ${formErrors.volume ? "border-red-300 focus-visible:ring-red-500" : ""}`} />
              <FieldError>{formErrors.volume}</FieldError>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Number</label>
              <Input value={form.number} onChange={(event) => handleInputChange("number", event.target.value)} className={`rounded-lg ${formErrors.number ? "border-red-300 focus-visible:ring-red-500" : ""}`} />
              <FieldError>{formErrors.number}</FieldError>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Duration</label>
              <Input value={form.duration} onChange={(event) => handleInputChange("duration", event.target.value)} className={`rounded-lg ${formErrors.duration ? "border-red-300 focus-visible:ring-red-500" : ""}`} />
              <FieldError>{formErrors.duration}</FieldError>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Full Issue PDF (optional)</label>
            <p className="text-xs text-slate-500">
              Upload this when the complete issue should open as one PDF. You can alternatively add individual entries below.
            </p>
            <div
              role="button"
              tabIndex={form.issue_pdf || form.issue_pdf_url ? -1 : 0}
              aria-disabled={Boolean(form.issue_pdf || form.issue_pdf_url)}
              onClick={() => {
                if (!form.issue_pdf && !form.issue_pdf_url) issuePdfInputRef.current?.click();
              }}
              onKeyDown={(event) => {
                if (!form.issue_pdf && !form.issue_pdf_url && (event.key === "Enter" || event.key === " ")) {
                  event.preventDefault();
                  issuePdfInputRef.current?.click();
                }
              }}
              className={`rounded-lg border border-dashed p-4 text-center transition-all ${
                form.issue_pdf || form.issue_pdf_url
                  ? "cursor-not-allowed border-slate-200 bg-slate-100 opacity-60"
                  : "cursor-pointer border-slate-200 bg-slate-50 hover:border-primary/40 hover:bg-white"
              }`}
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
                <Upload className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-700">
                {form.issue_pdf || form.issue_pdf_url ? "PDF upload disabled" : "Upload full issue PDF"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {form.issue_pdf || form.issue_pdf_url
                  ? "Use View or Delete below"
                  : "Only PDF files are allowed"}
              </p>
            </div>
            <Input
              ref={issuePdfInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              disabled={Boolean(form.issue_pdf || form.issue_pdf_url)}
              onChange={(event) => handleIssuePdfSelect(event.target.files?.[0])}
            />
            {form.issue_pdf || form.issue_pdf_url ? (
              <PdfUploadedStatus
                file={form.issue_pdf}
                url={form.issue_pdf_url}
                onDelete={handleDeleteIssuePdf}
              />
            ) : null}
            <FieldError>{formErrors.content}</FieldError>
          </div>
        </div>

        {Object.keys(form.sections).map(renderSection)}

        <div className="rounded-lg border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="rounded-lg" onClick={() => navigate("/journals")}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-lg" disabled={isSaving}>
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
