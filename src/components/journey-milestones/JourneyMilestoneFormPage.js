import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import useToast from "../../hooks/useToast";
import apiClient from "../../lib/utils/network-client";
import { Button } from "../ui/button";
import { FieldError } from "../ui/field";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const ICON_OPTIONS = [
  ["star", "Star"],
  ["building", "Building"],
  ["microscope", "Microscope"],
  ["award", "Award"],
  ["heart", "Heart"],
  ["graduation-cap", "Graduation Cap"],
  ["brain-circuit", "Brain Circuit"],
  ["activity", "Activity"],
  ["stethoscope", "Stethoscope"],
  ["ambulance", "Ambulance"],
  ["users", "Users"],
  ["shield-check", "Shield Check"],
];

const makeEmptyForm = () => ({
  year: String(new Date().getFullYear()),
  icon_key: "building",
  status: "active",
  events: [{ title: "", description: "" }],
});

const JourneyMilestoneFormPage = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showErrorToast, showSuccessToast } = useToast();
  const isEditMode = mode === "edit";
  const [form, setForm] = useState(makeEmptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [isPageLoading, setIsPageLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const pageTitle = useMemo(
    () => (isEditMode ? "Edit Journey Milestone" : "Create Journey Milestone"),
    [isEditMode],
  );

  useEffect(() => {
    if (!isEditMode) return;

    const fetchItem = async () => {
      setIsPageLoading(true);
      try {
        const response = await apiClient.get(`/journey-milestones/${id}`);
        const item = response.data?.data;
        if (!item) {
          showErrorToast("Journey milestone not found");
          navigate("/journey-milestones");
          return;
        }
        setForm({
          year: String(item.year || ""),
          icon_key: item.icon_key || "building",
          status: item.status || "active",
          events: (item.events || []).map((event) => ({
            title: event.title || "",
            description: event.description || "",
          })),
        });
      } catch (err) {
        showErrorToast(err.response?.data?.message || "Failed to load journey milestone");
        navigate("/journey-milestones");
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchItem();
  }, [id, isEditMode, navigate, showErrorToast]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: "" }));
  };

  const updateEvent = (index, field, value) => {
    setForm((current) => ({
      ...current,
      events: current.events.map((event, eventIndex) =>
        eventIndex === index ? { ...event, [field]: value } : event,
      ),
    }));
    setFormErrors((current) => ({ ...current, events: "" }));
  };

  const addEvent = () => {
    setForm((current) => ({
      ...current,
      events: [...current.events, { title: "", description: "" }],
    }));
  };

  const removeEvent = (index) => {
    setForm((current) => ({
      ...current,
      events: current.events.filter((_, eventIndex) => eventIndex !== index),
    }));
  };

  const validateForm = () => {
    const errors = {};
    const year = Number(form.year);
    if (!Number.isInteger(year) || year < 1800 || year > 2200) {
      errors.year = "Enter a valid year between 1800 and 2200.";
    }
    if (form.events.length === 0) {
      errors.events = "Add at least one journey event.";
    } else if (form.events.some((event) => !event.title.trim() || !event.description.trim())) {
      errors.events = "Every event needs a title and description.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    const payload = {
      ...form,
      year: Number(form.year),
      events: form.events.map((item) => ({
        title: item.title.trim(),
        description: item.description.trim(),
      })),
    };

    try {
      if (isEditMode) {
        await apiClient.put(`/journey-milestones/${id}`, payload);
        showSuccessToast("Journey milestone updated successfully");
      } else {
        await apiClient.post("/journey-milestones", payload);
        showSuccessToast("Journey milestone created successfully");
      }
      navigate("/journey-milestones");
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to save journey milestone");
    } finally {
      setIsSaving(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="rounded-lg border border-white/60 bg-white/80 p-8 shadow-sm">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading journey milestone editor...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] space-y-6">
      <div>
        <Button
          type="button"
          variant="ghost"
          className="-ml-3 mb-2 rounded-lg px-3 text-slate-500"
          onClick={() => navigate("/journey-milestones")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Our Journey
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{pageTitle}</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">The public timeline updates from this content.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <section className="rounded-lg border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
          <h2 className="mb-5 text-lg font-bold text-slate-900">Milestone settings</h2>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Year</label>
              <Input type="number" min="1800" max="2200" value={form.year} onChange={(event) => updateField("year", event.target.value)} className="rounded-lg" />
              <FieldError>{formErrors.year}</FieldError>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Icon</label>
              <Select value={form.icon_key} onValueChange={(value) => updateField("icon_key", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select icon" />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Status</label>
              <Select value={form.status} onValueChange={(value) => updateField("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Events</h2>
              <p className="text-sm text-slate-500">A year can contain one or several timeline cards.</p>
            </div>
            <Button type="button" variant="outline" className="rounded-lg" onClick={addEvent}>
              <Plus className="mr-2 h-4 w-4" /> Add Event
            </Button>
          </div>

          <div className="space-y-4">
            {form.events.map((item, index) => (
              <div key={index} className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-700">Event {index + 1}</p>
                  <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 hover:text-red-600" disabled={form.events.length === 1} onClick={() => removeEvent(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Title</label>
                    <Input value={item.title} onChange={(event) => updateEvent(index, "title", event.target.value)} placeholder="e.g. New Hospital Wing" className="rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Description</label>
                    <textarea value={item.description} onChange={(event) => updateEvent(index, "description", event.target.value)} placeholder="Describe the milestone" rows={3} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <FieldError className="mt-3">{formErrors.events}</FieldError>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="rounded-lg" onClick={() => navigate("/journey-milestones")}>Cancel</Button>
          <Button type="submit" className="rounded-lg" disabled={isSaving}>
            {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? "Saving..." : isEditMode ? "Update Milestone" : "Create Milestone"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default JourneyMilestoneFormPage;
