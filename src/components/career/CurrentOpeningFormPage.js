import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, LoaderCircle, Save } from "lucide-react";
import { Button } from "../ui/button";
import { FieldError } from "../ui/field";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useAuthStore } from "../../context/AuthContext";
import { hasPermission } from "../../lib/utils/permissions";
import useToast from "../../hooks/useToast";
import apiClient from "../../lib/utils/network-client";

const EMPTY_FORM = {
  position: "",
  education: "",
  description: "",
  experience: "",
  status: "open",
  location: "",
  department: "",
  closing_date: "",
  salary_range: "",
};

const VALID_STATUSES = ["draft", "open", "closed"];

const CurrentOpeningFormPage = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  const { showErrorToast, showSuccessToast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isPageLoading, setIsPageLoading] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);
  const isEditMode = mode === "edit";
  const isAdmin = hasPermission(user, "career", isEditMode ? "edit" : "create");
  const pageTitle = useMemo(() => (isEditMode ? "Edit Current Opening" : "Create Current Opening"), [isEditMode]);

  useEffect(() => {
    if (!isEditMode || !isAdmin) {
      setIsPageLoading(false);
      return;
    }

    const fetchItem = async () => {
      setIsPageLoading(true);
      try {
        const response = await apiClient.get(`/career/current-openings/${id}`);
        const item = response.data?.data;
        if (!item) {
          showErrorToast("Current opening not found");
          navigate("/career/current-openings");
          return;
        }
        setForm({
          position: item.position || "",
          education: item.education || "",
          description: item.description || "",
          experience: item.experience || "",
          status: item.status || "open",
          location: item.location || "",
          department: item.department || "",
          closing_date: item.closing_date ? item.closing_date.slice(0, 10) : "",
          salary_range: item.salary_range || "",
        });
      } catch (err) {
        showErrorToast(err.response?.data?.message || "Failed to load current opening");
        navigate("/career/current-openings");
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchItem();
  }, [id, isAdmin, isEditMode, navigate, showErrorToast]);

  const handleInputChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: "" }));
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!form.position.trim()) nextErrors.position = "Position is required.";
    if (!form.education.trim()) nextErrors.education = "Education is required.";
    if (!form.description.trim()) nextErrors.description = "Description is required.";
    if (!form.experience.trim()) nextErrors.experience = "Experience is required.";
    if (!VALID_STATUSES.includes(form.status)) nextErrors.status = "Status is required.";
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      if (isEditMode) {
        await apiClient.put(`/career/current-openings/${id}`, form);
        showSuccessToast("Current opening updated successfully");
      } else {
        await apiClient.post("/career/current-openings", form);
        showSuccessToast("Current opening created successfully");
      }
      navigate("/career/current-openings");
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to save current opening");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="rounded-lg border border-white/60 bg-white/80 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{pageTitle}</h1>
        <p className="mt-2 text-sm text-slate-500">This section is only available for admin users.</p>
      </div>
    );
  }

  if (isPageLoading) {
    return (
      <div className="rounded-lg border border-white/60 bg-white/80 p-8 shadow-sm">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading current opening editor...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] space-y-6">
      <div>
        <Button type="button" variant="ghost" className="-ml-3 mb-2 rounded-lg px-3 text-slate-500" onClick={() => navigate("/career/current-openings")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Current Openings
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{pageTitle}</h1>
      </div>

      <form onSubmit={handleSave} className="rounded-lg border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
        <div className="space-y-4">
          {/* Position */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Position</label>
            <Input value={form.position} onChange={(event) => handleInputChange("position", event.target.value)} className={`rounded-lg ${formErrors.position ? "border-red-300 focus-visible:ring-red-500" : ""}`} />
            <FieldError>{formErrors.position}</FieldError>
          </div>

          {/* Education */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Education</label>
            <Input value={form.education} onChange={(event) => handleInputChange("education", event.target.value)} className={`rounded-lg ${formErrors.education ? "border-red-300 focus-visible:ring-red-500" : ""}`} />
            <FieldError>{formErrors.education}</FieldError>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Description</label>
            <textarea value={form.description} onChange={(event) => handleInputChange("description", event.target.value)} rows={6} className={`min-h-[160px] w-full rounded-lg border bg-white px-4 py-3 text-sm text-slate-700 outline-none ${formErrors.description ? "border-red-300 focus:ring-2 focus:ring-red-500" : "border-slate-200 focus:ring-2 focus:ring-primary/30"}`} />
            <FieldError>{formErrors.description}</FieldError>
          </div>

          {/* Experience */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Experience</label>
            <Input value={form.experience} onChange={(event) => handleInputChange("experience", event.target.value)} className={`rounded-lg ${formErrors.experience ? "border-red-300 focus-visible:ring-red-500" : ""}`} />
            <FieldError>{formErrors.experience}</FieldError>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Status</label>
            <Select value={form.status} onValueChange={(value) => handleInputChange("status", value)}>
              <SelectTrigger className={formErrors.status ? "border-red-300" : ""}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="draft">Draft (hidden from public)</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <FieldError>{formErrors.status}</FieldError>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Location <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <Input
              value={form.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              placeholder="e.g. Ahmedabad"
              className="rounded-lg"
            />
          </div>

          {/* Department */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Department <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <Input
              value={form.department}
              onChange={(e) => handleInputChange("department", e.target.value)}
              placeholder="e.g. Nursing"
              className="rounded-lg"
            />
          </div>

          {/* Closing Date */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Closing Date <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <Input
              type="date"
              value={form.closing_date}
              onChange={(e) => handleInputChange("closing_date", e.target.value)}
              className="rounded-lg"
            />
          </div>

          {/* Salary Range */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Salary Range <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <Input
              value={form.salary_range}
              onChange={(e) => handleInputChange("salary_range", e.target.value)}
              placeholder="e.g. ₹4–6 LPA"
              className="rounded-lg"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="rounded-lg" onClick={() => navigate("/career/current-openings")}>Cancel</Button>
          <Button type="submit" className="rounded-lg" disabled={isSaving}>
            {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? "Saving..." : isEditMode ? "Update Current Opening" : "Create Current Opening"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CurrentOpeningFormPage;
