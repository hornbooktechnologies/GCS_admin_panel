import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, LoaderCircle, Save } from "lucide-react";
import { Button } from "../ui/button";
import { FieldError } from "../ui/field";
import { Input } from "../ui/input";
import useToast from "../../hooks/useToast";
import apiClient from "../../lib/utils/network-client";

const EMPTY_FORM = {
  year: "",
  camps: "",
  no_of_patients: "",
};

const HealthCampFormPage = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showErrorToast, showSuccessToast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isPageLoading, setIsPageLoading] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = mode === "edit";
  const pageTitle = useMemo(() => (isEditMode ? "Edit Health Camp" : "Create Health Camp"), [isEditMode]);

  useEffect(() => {
    if (!isEditMode) {
      setIsPageLoading(false);
      return;
    }

    const fetchItem = async () => {
      setIsPageLoading(true);
      try {
        const response = await apiClient.get(`/health-camps/${id}`);
        const item = response.data?.data;
        if (!item) {
          showErrorToast("Health camp not found");
          navigate("/health-camps");
          return;
        }
        setForm({
          year: item.year ? String(item.year) : "",
          camps: item.camps !== undefined ? String(item.camps) : "",
          no_of_patients: item.no_of_patients !== undefined ? String(item.no_of_patients) : "",
        });
      } catch (err) {
        showErrorToast(err.response?.data?.message || "Failed to load health camp");
        navigate("/health-camps");
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

  const validateForm = () => {
    const nextErrors = {};

    if (!form.year.trim()) nextErrors.year = "Year is required.";
    if (!form.camps.trim()) nextErrors.camps = "Camps is required.";
    if (!form.no_of_patients.trim()) nextErrors.no_of_patients = "Number of patients is required.";

    if (form.year && Number.isNaN(Number.parseInt(form.year, 10))) nextErrors.year = "Year must be numeric.";
    if (form.camps && Number.isNaN(Number.parseInt(form.camps, 10))) nextErrors.camps = "Camps must be numeric.";
    if (form.no_of_patients && Number.isNaN(Number.parseInt(form.no_of_patients, 10))) nextErrors.no_of_patients = "Number of patients must be numeric.";

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const payload = {
        year: form.year.trim(),
        camps: form.camps.trim(),
        no_of_patients: form.no_of_patients.trim(),
      };

      if (isEditMode) {
        await apiClient.put(`/health-camps/${id}`, payload);
        showSuccessToast("Health camp updated successfully");
      } else {
        await apiClient.post("/health-camps", payload);
        showSuccessToast("Health camp created successfully");
      }

      navigate("/health-camps");
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to save health camp");
    } finally {
      setIsSaving(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-sm">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading health camp editor...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] space-y-6">
      <div>
        <Button type="button" variant="ghost" className="-ml-3 mb-2 rounded-xl px-3 text-slate-500" onClick={() => navigate("/health-camps")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Health Camps
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{pageTitle}</h1>
      </div>

      <form onSubmit={handleSave} className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Year</label>
            <Input type="number" value={form.year} onChange={(event) => handleInputChange("year", event.target.value)} className={`rounded-xl ${formErrors.year ? "border-red-300 focus-visible:ring-red-500" : ""}`} />
            <FieldError>{formErrors.year}</FieldError>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Camps</label>
            <Input type="number" value={form.camps} onChange={(event) => handleInputChange("camps", event.target.value)} className={`rounded-xl ${formErrors.camps ? "border-red-300 focus-visible:ring-red-500" : ""}`} />
            <FieldError>{formErrors.camps}</FieldError>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">No. of Patient</label>
            <Input type="number" value={form.no_of_patients} onChange={(event) => handleInputChange("no_of_patients", event.target.value)} className={`rounded-xl ${formErrors.no_of_patients ? "border-red-300 focus-visible:ring-red-500" : ""}`} />
            <FieldError>{formErrors.no_of_patients}</FieldError>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => navigate("/health-camps")}>
            Cancel
          </Button>
          <Button type="submit" className="rounded-xl" disabled={isSaving}>
            {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? "Saving..." : isEditMode ? "Update Health Camp" : "Create Health Camp"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default HealthCampFormPage;
