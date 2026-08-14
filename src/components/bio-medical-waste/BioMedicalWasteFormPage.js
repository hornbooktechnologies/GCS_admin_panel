import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calculator, LoaderCircle, Save } from "lucide-react";
import { Button } from "../ui/button";
import { FieldError } from "../ui/field";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import useToast from "../../hooks/useToast";
import apiClient from "../../lib/utils/network-client";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const EMPTY_FORM = {
  report_year: String(new Date().getFullYear()),
  report_month: "",
  red_kg: "",
  yellow_kg: "",
  blue_kg: "",
  white_kg: "",
  status: "published",
  notes: "",
};

const weightFields = [
  { key: "red_kg", label: "Red Bag", dot: "bg-red-500" },
  { key: "yellow_kg", label: "Yellow Bag", dot: "bg-yellow-400" },
  { key: "blue_kg", label: "Blue Bag", dot: "bg-blue-500" },
  { key: "white_kg", label: "White Container", dot: "bg-slate-400" },
];

const BioMedicalWasteFormPage = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showErrorToast, showSuccessToast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isPageLoading, setIsPageLoading] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);
  const isEditMode = mode === "edit";
  const total = useMemo(
    () => weightFields.reduce((sum, { key }) => sum + (Number(form[key]) || 0), 0),
    [form],
  );

  useEffect(() => {
    if (!isEditMode) return;
    const fetchRecord = async () => {
      setIsPageLoading(true);
      try {
        const response = await apiClient.get(`/bio-medical-waste/admin/${id}`);
        const record = response.data?.data;
        if (!record) throw new Error("Biomedical waste record not found");
        setForm({
          report_year: String(record.report_year),
          report_month: String(record.report_month),
          red_kg: String(record.red_kg),
          yellow_kg: String(record.yellow_kg),
          blue_kg: String(record.blue_kg),
          white_kg: String(record.white_kg),
          status: record.status,
          notes: record.notes || "",
        });
      } catch (err) {
        showErrorToast(err.response?.data?.message || err.message || "Failed to load record");
        navigate("/bio-medical-waste");
      } finally {
        setIsPageLoading(false);
      }
    };
    fetchRecord();
  }, [id, isEditMode, navigate, showErrorToast]);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: "" }));
  };

  const validate = () => {
    const errors = {};
    const year = Number(form.report_year);
    if (!Number.isInteger(year) || year < 2000 || year > new Date().getFullYear() + 1) {
      errors.report_year = "Enter a valid report year.";
    }
    if (!form.report_month) errors.report_month = "Select a report month.";
    weightFields.forEach(({ key, label }) => {
      if (form[key] === "" || !Number.isFinite(Number(form[key])) || Number(form[key]) < 0) {
        errors[key] = `${label} must be zero or greater.`;
      }
    });
    if (form.notes.length > 1000) errors.notes = "Notes cannot exceed 1000 characters.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        report_year: Number(form.report_year),
        report_month: Number(form.report_month),
        red_kg: Number(form.red_kg),
        yellow_kg: Number(form.yellow_kg),
        blue_kg: Number(form.blue_kg),
        white_kg: Number(form.white_kg),
      };
      if (isEditMode) {
        await apiClient.put(`/bio-medical-waste/${id}`, payload);
        showSuccessToast("Biomedical waste record updated successfully");
      } else {
        await apiClient.post("/bio-medical-waste", payload);
        showSuccessToast("Biomedical waste record created successfully");
      }
      navigate("/bio-medical-waste");
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to save biomedical waste record");
    } finally {
      setIsSaving(false);
    }
  };

  if (isPageLoading) {
    return <div className="rounded-lg border border-white/60 bg-white/80 p-8 shadow-sm"><div className="flex items-center gap-3 text-sm font-medium text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading record...</div></div>;
  }

  return (
    <div className="max-w-[1200px] space-y-6">
      <div>
        <Button type="button" variant="ghost" className="-ml-3 mb-2 rounded-lg px-3 text-slate-500" onClick={() => navigate("/bio-medical-waste")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Biomedical Waste
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{isEditMode ? "Edit Monthly Record" : "Add Monthly Record"}</h1>
        <p className="mt-1 text-sm text-slate-500">The total is calculated automatically from all four categories.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <label htmlFor="report-year" className="text-sm font-semibold text-slate-700">Report Year</label>
            <Input id="report-year" type="number" min="2000" max={new Date().getFullYear() + 1} value={form.report_year} onChange={(event) => setField("report_year", event.target.value)} className={formErrors.report_year ? "border-red-300" : ""} />
            <FieldError>{formErrors.report_year}</FieldError>
          </div>
          <div className="space-y-2">
            <label htmlFor="report-month" className="text-sm font-semibold text-slate-700">Report Month</label>
            <Select value={form.report_month || undefined} onValueChange={(value) => setField("report_month", value)}>
              <SelectTrigger id="report-month" className={formErrors.report_month ? "border-red-300 focus:ring-red-100" : ""}>
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, index) => <SelectItem key={month} value={String(index + 1)}>{month}</SelectItem>)}
              </SelectContent>
            </Select>
            <FieldError>{formErrors.report_month}</FieldError>
          </div>
          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-semibold text-slate-700">Publication Status</label>
            <Select value={form.status} onValueChange={(value) => setField("status", value)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="published">Published — visible publicly</SelectItem>
                <SelectItem value="draft">Draft — admin only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-6 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          {weightFields.map(({ key, label, dot }) => (
            <div key={key} className="space-y-2">
              <label htmlFor={key} className="flex items-center gap-2 text-sm font-semibold text-slate-700"><span className={`h-2.5 w-2.5 rounded-full ${dot}`} />{label} (kg)</label>
              <Input id={key} type="number" min="0" step="0.001" value={form[key]} onChange={(event) => setField(key, event.target.value)} placeholder="0.000" className={formErrors[key] ? "border-red-300" : ""} />
              <FieldError>{formErrors[key]}</FieldError>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-blue-700"><Calculator className="h-5 w-5" /></div><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">Calculated total</p><p className="text-xs text-slate-500">Saved automatically</p></div></div>
          <p className="text-2xl font-bold text-slate-900">{total.toLocaleString("en-IN", { maximumFractionDigits: 3 })} kg</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="notes" className="text-sm font-semibold text-slate-700">Internal/Public Notes <span className="font-normal text-slate-400">(optional)</span></label>
          <Textarea id="notes" value={form.notes} onChange={(event) => setField("notes", event.target.value)} placeholder="Add context about this month's report..." maxLength={1000} className={formErrors.notes ? "border-red-300" : ""} />
          <div className="flex justify-between"><FieldError>{formErrors.notes}</FieldError><span className="text-xs text-slate-400">{form.notes.length}/1000</span></div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="rounded-lg" onClick={() => navigate("/bio-medical-waste")}>Cancel</Button>
          <Button type="submit" className="rounded-lg" disabled={isSaving}>
            {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? "Saving..." : isEditMode ? "Update Record" : "Create Record"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BioMedicalWasteFormPage;
