import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, LoaderCircle, Save } from "lucide-react";
import { Button } from "../ui/button";
import { FieldError } from "../ui/field";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import useToast from "../../hooks/useToast";
import apiClient from "../../lib/utils/network-client";

const EMPTY_FORM = {
  name: "",
  department: "hospital",
  description: "",
  sort_order: "0",
};

const DEPARTMENTS = [
  { value: "hospital", label: "Hospital" },
  { value: "research", label: "Research" },
  { value: "medical_college", label: "Medical College" },
  { value: "nursing", label: "Nursing" },
];

const CommitteeFormPage = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showErrorToast, showSuccessToast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isPageLoading, setIsPageLoading] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);
  const isEditMode = mode === "edit";
  const pageTitle = useMemo(() => (isEditMode ? "Edit Committee" : "Create Committee"), [isEditMode]);

  useEffect(() => {
    if (!isEditMode) {
      setIsPageLoading(false);
      return;
    }

    const fetchItem = async () => {
      setIsPageLoading(true);
      try {
        const response = await apiClient.get(`/committees/${id}`);
        const item = response.data?.data?.committee;
        if (!item) {
          showErrorToast("Committee not found");
          navigate("/committees");
          return;
        }
        setForm({
          name: item.name || "",
          department: item.department || "hospital",
          description: item.description || "",
          sort_order: String(item.sort_order ?? 0),
        });
      } catch (err) {
        showErrorToast(err.response?.data?.message || "Failed to load committee");
        navigate("/committees");
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

  const handleSave = async (event) => {
    event.preventDefault();
    const errors = {};
    if (!form.name.trim()) errors.name = "Committee name is required.";
    if (!form.department) errors.department = "Department is required.";
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        department: form.department,
        description: form.description.trim() || null,
        sort_order: Number(form.sort_order) || 0,
      };

      if (isEditMode) {
        await apiClient.put(`/committees/${id}`, payload);
        showSuccessToast("Committee updated successfully");
      } else {
        await apiClient.post("/committees", payload);
        showSuccessToast("Committee created successfully");
      }
      navigate("/committees");
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to save committee");
    } finally {
      setIsSaving(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="rounded-lg border border-white/60 bg-white/80 p-8 shadow-sm">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading committee editor...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] space-y-6">
      <div>
        <Button type="button" variant="ghost" className="-ml-3 mb-2 rounded-lg px-3 text-slate-500" onClick={() => navigate("/committees")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Committees
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{pageTitle}</h1>
      </div>

      <form onSubmit={handleSave} className="rounded-lg border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Committee Name</label>
            <Input
              value={form.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`rounded-lg ${formErrors.name ? "border-red-300 focus-visible:ring-red-500" : ""}`}
              placeholder="e.g. Blood Transfusion Committee"
            />
            <FieldError>{formErrors.name}</FieldError>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Department</label>
            <Select value={form.department} onValueChange={(v) => handleInputChange("department", v)}>
              <SelectTrigger className={`rounded-lg ${formErrors.department ? "border-red-300" : ""}`}>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError>{formErrors.department}</FieldError>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Description <span className="font-normal text-slate-400">(optional)</span></label>
            <Input
              value={form.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="rounded-lg"
              placeholder="Short description shown on the committees page"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Sort Order</label>
            <Input
              type="number"
              min="0"
              value={form.sort_order}
              onChange={(e) => handleInputChange("sort_order", e.target.value)}
              className="rounded-lg"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="rounded-lg" onClick={() => navigate("/committees")}>Cancel</Button>
          <Button type="submit" className="rounded-lg" disabled={isSaving}>
            {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? "Saving..." : isEditMode ? "Update Committee" : "Create Committee"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CommitteeFormPage;
