import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, LoaderCircle, Save } from "lucide-react";
import { Button } from "../ui/button";
import { FieldError } from "../ui/field";
import { Input } from "../ui/input";
import useToast from "../../hooks/useToast";
import apiClient from "../../lib/utils/network-client";

const TeamCategoryFormPage = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showErrorToast, showSuccessToast } = useToast();
  const [title, setTitle] = useState("");
  const [errorText, setErrorText] = useState("");
  const [isPageLoading, setIsPageLoading] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);
  const isEditMode = mode === "edit";
  const pageTitle = useMemo(() => (isEditMode ? "Edit Team Category" : "Create Team Category"), [isEditMode]);

  useEffect(() => {
    if (!isEditMode) {
      setIsPageLoading(false);
      return;
    }

    const fetchItem = async () => {
      setIsPageLoading(true);
      try {
        const response = await apiClient.get(`/team-categories/${id}`);
        const item = response.data?.data;
        if (!item) {
          showErrorToast("Team category not found");
          navigate("/master/team-categories");
          return;
        }
        setTitle(item.title || "");
      } catch (err) {
        showErrorToast(err.response?.data?.message || "Failed to load team category");
        navigate("/master/team-categories");
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchItem();
  }, [id, isEditMode, navigate, showErrorToast]);

  const handleSave = async (event) => {
    event.preventDefault();
    if (!title.trim()) {
      setErrorText("Title is required.");
      return;
    }

    setIsSaving(true);
    try {
      if (isEditMode) {
        await apiClient.put(`/team-categories/${id}`, { title: title.trim() });
        showSuccessToast("Team category updated successfully");
      } else {
        await apiClient.post("/team-categories", { title: title.trim() });
        showSuccessToast("Team category created successfully");
      }
      navigate("/master/team-categories");
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to save team category");
    } finally {
      setIsSaving(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-sm">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading team category editor...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] space-y-6">
      <div>
        <Button type="button" variant="ghost" className="-ml-3 mb-2 rounded-xl px-3 text-slate-500" onClick={() => navigate("/master/team-categories")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Team Categories
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{pageTitle}</h1>
      </div>

      <form onSubmit={handleSave} className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Title</label>
          <Input value={title} onChange={(event) => { setTitle(event.target.value); setErrorText(""); }} className={`rounded-xl ${errorText ? "border-red-300 focus-visible:ring-red-500" : ""}`} />
          <FieldError>{errorText}</FieldError>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => navigate("/master/team-categories")}>Cancel</Button>
          <Button type="submit" className="rounded-xl" disabled={isSaving}>
            {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? "Saving..." : isEditMode ? "Update Team Category" : "Create Team Category"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TeamCategoryFormPage;
