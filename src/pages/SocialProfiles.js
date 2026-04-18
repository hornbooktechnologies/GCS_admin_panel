import React, { useEffect, useState } from "react";
import { Globe, RefreshCw } from "lucide-react";
import { Button } from "../components/ui/button";
import { FieldError } from "../components/ui/field";
import { Input } from "../components/ui/input";
import useToast from "../hooks/useToast";
import apiClient from "../lib/utils/network-client";

const EMPTY_FORM = {
  facebook: "",
  twitter: "",
  linkedin: "",
  youtube: "",
  instagram: "",
};

const FIELDS = [
  { key: "facebook", label: "Facebook" },
  { key: "twitter", label: "Twitter" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "youtube", label: "YouTube" },
  { key: "instagram", label: "Instagram" },
];

const SocialProfiles = () => {
  const { showErrorToast, showSuccessToast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProfiles = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/social-profiles");
      const data = response.data?.data || {};
      setForm({
        facebook: data.facebook || "",
        twitter: data.twitter || "",
        linkedin: data.linkedin || "",
        youtube: data.youtube || "",
        instagram: data.instagram || "",
      });
      setErrors({});
    } catch (err) {
      showErrorToast(
        err.response?.data?.message || "Failed to load social profiles",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleChange = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setErrors((current) => ({
      ...current,
      [field]: "",
    }));
  };

  const validateForm = () => {
    const nextErrors = {};

    for (const field of FIELDS) {
      const value = form[field.key].trim();
      if (!value) {
        nextErrors[field.key] = `${field.label} is required.`;
        continue;
      }

      try {
        new URL(value);
      } catch {
        nextErrors[field.key] = `Enter a valid ${field.label} URL.`;
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.put("/social-profiles", {
        facebook: form.facebook.trim(),
        twitter: form.twitter.trim(),
        linkedin: form.linkedin.trim(),
        youtube: form.youtube.trim(),
        instagram: form.instagram.trim(),
      });
      showSuccessToast("Social profiles updated successfully");
      fetchProfiles();
    } catch (err) {
      showErrorToast(
        err.response?.data?.message || "Unable to update social profiles",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Social Profiles
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Edit the global social media links used across GCS Hospital CRM.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={fetchProfiles}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
        {isLoading ? (
          <div className="py-12 text-center text-sm font-medium text-slate-500">
            Loading social profiles...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              {FIELDS.map((field) => (
                <div key={field.key} className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    {field.label}
                  </label>
                  <Input
                    value={form[field.key]}
                    onChange={(event) =>
                      handleChange(field.key, event.target.value)
                    }
                    placeholder={`https://${field.key}.com/...`}
                    className={`rounded-xl ${errors[field.key] ? "border-red-300 focus-visible:ring-red-500" : ""}`}
                  />
                  <FieldError>{errors[field.key]}</FieldError>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white p-3 text-primary shadow-sm">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">
                    Single Settings Record
                  </h2>
                  <p className="text-xs text-slate-500">
                    This module stores one editable set of social profile URLs. It does not support list or delete actions.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="rounded-xl" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Social Profiles"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SocialProfiles;
