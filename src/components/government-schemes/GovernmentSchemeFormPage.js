import React, { useEffect, useMemo, useState } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/node_modules/quill/dist/quill.snow.css";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { FieldError } from "../ui/field";
import { Input } from "../ui/input";
import useToast from "../../hooks/useToast";
import apiClient from "../../lib/utils/network-client";

const EMPTY_FORM = {
  scheme_name: "",
  badge_text: "",
  description: "",
  cash_less_cover: "",
  required_documents: [""],
  opd_visits: "",
  ipd_admissions: "",
  dialysis_count: "",
  chemo_count: "",
  free_opd_specialities: [""],
  empanelled_specialities: [""],
  display_order: "0",
};

const quillModules = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

const listLabels = {
  required_documents: "Required Documents",
  free_opd_specialities: "Free OPD Specialities",
  empanelled_specialities: "Empanelled Specialities",
};

const GovernmentSchemeFormPage = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showErrorToast, showSuccessToast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isPageLoading, setIsPageLoading] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = mode === "edit";
  const pageTitle = useMemo(() => (isEditMode ? "Edit Government Scheme" : "Create Government Scheme"), [isEditMode]);

  useEffect(() => {
    if (!isEditMode) {
      setIsPageLoading(false);
      return;
    }

    const fetchScheme = async () => {
      setIsPageLoading(true);
      try {
        const response = await apiClient.get(`/government-schemes/${id}`);
        const item = response.data?.data;
        if (!item) {
          showErrorToast("Government scheme not found");
          navigate("/government-schemes");
          return;
        }

        setForm({
          scheme_name: item.scheme_name || "",
          badge_text: item.badge_text || "",
          description: item.description || "",
          cash_less_cover: item.cash_less_cover || "",
          required_documents: item.required_documents?.length ? item.required_documents : [""],
          opd_visits: item.opd_visits !== null && item.opd_visits !== undefined ? String(item.opd_visits) : "",
          ipd_admissions: item.ipd_admissions !== null && item.ipd_admissions !== undefined ? String(item.ipd_admissions) : "",
          dialysis_count: item.dialysis_count !== null && item.dialysis_count !== undefined ? String(item.dialysis_count) : "",
          chemo_count: item.chemo_count !== null && item.chemo_count !== undefined ? String(item.chemo_count) : "",
          free_opd_specialities: item.free_opd_specialities?.length ? item.free_opd_specialities : [""],
          empanelled_specialities: item.empanelled_specialities?.length ? item.empanelled_specialities : [""],
          display_order: item.display_order !== undefined ? String(item.display_order || 0) : "0",
        });
      } catch (err) {
        showErrorToast(err.response?.data?.message || "Failed to load government scheme");
        navigate("/government-schemes");
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchScheme();
  }, [id, isEditMode, navigate, showErrorToast]);

  const handleInputChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: "" }));
  };

  const handleListChange = (field, index, value) => {
    setForm((current) => ({
      ...current,
      [field]: current[field].map((item, itemIndex) => (itemIndex === index ? value : item)),
    }));
    setFormErrors((current) => ({ ...current, [field]: "" }));
  };

  const handleAddListItem = (field) => {
    setForm((current) => ({ ...current, [field]: [...current[field], ""] }));
  };

  const handleRemoveListItem = (field, index) => {
    setForm((current) => {
      if (current[field].length === 1) {
        return { ...current, [field]: [""] };
      }

      return {
        ...current,
        [field]: current[field].filter((_, itemIndex) => itemIndex !== index),
      };
    });
    setFormErrors((current) => ({ ...current, [field]: "" }));
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!form.scheme_name.trim()) nextErrors.scheme_name = "Scheme name is required.";

    ["opd_visits", "ipd_admissions", "dialysis_count", "chemo_count", "display_order"].forEach((field) => {
      if (form[field] !== "" && (Number.isNaN(Number.parseInt(form[field], 10)) || Number.parseInt(form[field], 10) < 0)) {
        nextErrors[field] = "Enter a valid positive number.";
      }
    });

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const cleanList = (field) => form[field].map((item) => item.trim()).filter(Boolean);

  const handleSave = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const payload = {
        ...form,
        scheme_name: form.scheme_name.trim(),
        badge_text: form.badge_text.trim(),
        description: form.description,
        cash_less_cover: form.cash_less_cover.trim(),
        required_documents: cleanList("required_documents"),
        free_opd_specialities: cleanList("free_opd_specialities"),
        empanelled_specialities: cleanList("empanelled_specialities"),
      };

      if (isEditMode) {
        await apiClient.put(`/government-schemes/${id}`, payload);
        showSuccessToast("Government scheme updated successfully");
      } else {
        await apiClient.post("/government-schemes", payload);
        showSuccessToast("Government scheme created successfully");
      }

      navigate("/government-schemes");
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to save government scheme");
    } finally {
      setIsSaving(false);
    }
  };

  const renderListEditor = (field) => (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">{listLabels[field]}</h2>
          <p className="text-xs text-slate-500">Add one item per row.</p>
        </div>
        <Button type="button" variant="outline" className="rounded-lg" onClick={() => handleAddListItem(field)}>
          <Plus className="mr-2 h-4 w-4" />
          Add More
        </Button>
      </div>

      <div className="space-y-3">
        {form[field].map((value, index) => (
          <div key={`${field}-${index}`} className="flex items-start gap-3">
            <Input value={value} onChange={(event) => handleListChange(field, index, event.target.value)} placeholder={`${listLabels[field]} ${index + 1}`} className="rounded-lg" />
            <Button type="button" variant="outline" className="rounded-lg border-red-200 px-3 text-red-600 hover:bg-red-50" onClick={() => handleRemoveListItem(field, index)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <FieldError>{formErrors[field]}</FieldError>
    </div>
  );

  if (isPageLoading) {
    return (
      <div className="rounded-lg border border-white/60 bg-white/80 p-8 shadow-sm">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading government scheme editor...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] space-y-6">
      <div>
        <Button type="button" variant="ghost" className="-ml-3 mb-2 rounded-lg px-3 text-slate-500" onClick={() => navigate("/government-schemes")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Government Schemes
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{pageTitle}</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6 rounded-lg border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Scheme Name</label>
            <Input value={form.scheme_name} onChange={(event) => handleInputChange("scheme_name", event.target.value)} className={`rounded-lg ${formErrors.scheme_name ? "border-red-300 focus-visible:ring-red-500" : ""}`} />
            <FieldError>{formErrors.scheme_name}</FieldError>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Badge Text</label>
            <Input value={form.badge_text} onChange={(event) => handleInputChange("badge_text", event.target.value)} className="rounded-lg" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Cash-less Cover</label>
            <Input value={form.cash_less_cover} onChange={(event) => handleInputChange("cash_less_cover", event.target.value)} className="rounded-lg" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Display Order</label>
            <Input type="number" min="0" value={form.display_order} onChange={(event) => handleInputChange("display_order", event.target.value)} className={`rounded-lg ${formErrors.display_order ? "border-red-300 focus-visible:ring-red-500" : ""}`} />
            <FieldError>{formErrors.display_order}</FieldError>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Description</label>
          <div className="overflow-hidden rounded-lg bg-white">
            <ReactQuill theme="snow" value={form.description} onChange={(value) => handleInputChange("description", value)} modules={quillModules} placeholder="Write scheme description here..." />
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-4">
          {["opd_visits", "ipd_admissions", "dialysis_count", "chemo_count"].map((field) => (
            <div key={field} className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                {field.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")}
              </label>
              <Input type="number" min="0" value={form[field]} onChange={(event) => handleInputChange(field, event.target.value)} className={`rounded-lg ${formErrors[field] ? "border-red-300 focus-visible:ring-red-500" : ""}`} />
              <FieldError>{formErrors[field]}</FieldError>
            </div>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          {renderListEditor("required_documents")}
          {renderListEditor("free_opd_specialities")}
          {renderListEditor("empanelled_specialities")}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="rounded-lg" onClick={() => navigate("/government-schemes")}>
            Cancel
          </Button>
          <Button type="submit" className="rounded-lg" disabled={isSaving}>
            {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? "Saving..." : isEditMode ? "Update Scheme" : "Create Scheme"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default GovernmentSchemeFormPage;
