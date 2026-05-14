import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, Image as ImageIcon, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { hasPermission } from "../lib/utils/permissions";
import { useAuthStore } from "../context/AuthContext";
import useToast from "../hooks/useToast";
import apiClient from "../lib/utils/network-client";
import { DeleteConfirmationButton } from "../components/common/ConfirmationDialog";


const DEFAULT_DOCTOR_IMAGE_URL = "/assets/icons/default-pic.jpg";

const Doctors = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showErrorToast, showSuccessToast } = useToast();
  const canCreate = hasPermission(user, "doctors", "create");
  const [doctors, setDoctors] = useState([]);
  const [specialities, setSpecialities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [showFilters, setShowFilters] = useState(false);
  const [selectedSpecialityId, setSelectedSpecialityId] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedHod, setSelectedHod] = useState("all");

  const hasActiveFilters = selectedSpecialityId !== "all" || selectedCategory !== "all" || selectedHod !== "all";

  const fetchSpecialities = async () => {
    try {
      const response = await apiClient.get("/specialities");
      setSpecialities(response.data?.data?.specialities || []);
    } catch (err) {
      console.error("Failed to load specialities for filter", err);
    }
  };

  const fetchDoctors = async (searchValue = debouncedSearch) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchValue) params.append("search", searchValue);
      if (selectedSpecialityId !== "all") params.append("speciality_id", selectedSpecialityId);
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      params.append("limit", "100");

      const response = await apiClient.get(`/doctors?${params.toString()}`);
      setDoctors(response.data?.data?.rows || []);
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Failed to load doctors");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecialities();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchDoctors(debouncedSearch);
  }, [debouncedSearch, selectedSpecialityId, selectedCategory]);

  const filteredDoctors = useMemo(() => {
    if (selectedHod === "all") return doctors;
    const isHodFilter = selectedHod === "true";
    return doctors.filter((doc) => Boolean(doc.is_hod) === isHodFilter);
  }, [doctors, selectedHod]);

  const sortedDoctors = useMemo(
    () =>
      [...filteredDoctors].sort((a, b) => {
        if (Boolean(a.is_hod) !== Boolean(b.is_hod)) {
          return Number(Boolean(b.is_hod)) - Number(Boolean(a.is_hod));
        }
        if ((a.display_order ?? 0) !== (b.display_order ?? 0)) {
          return (a.display_order ?? 0) - (b.display_order ?? 0);
        }
        return (a.name || "").localeCompare(b.name || "");
      }),
    [filteredDoctors],
  );

  const handleClearFilters = () => {
    setSelectedSpecialityId("all");
    setSelectedCategory("all");
    setSelectedHod("all");
    setSearch("");
  };

  const handleDelete = async (item) => {
    try {
      await apiClient.delete(`/doctors/${item.id}`);
      showSuccessToast("Doctor deleted successfully");
      fetchDoctors();
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to delete doctor");
    }
  };

  return (
    <div className="max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Doctors</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Manage doctor profiles and link them to one or more specialities.</p>
        </div>
        <div className="flex flex-col gap-3 md:flex-row">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or designation"
            className="min-w-64 rounded-lg"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className={`rounded-lg transition-all ${showFilters || hasActiveFilters ? "bg-slate-100 border-slate-300" : ""}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className={`mr-2 h-4 w-4 ${hasActiveFilters ? "text-primary fill-primary/10" : ""}`} />
              Filter
              {hasActiveFilters && (
                <span className="ml-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                  !
                </span>
              )}
            </Button>
            <Button type="button" variant="outline" className="rounded-lg" onClick={() => fetchDoctors(search.trim())}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
          {canCreate && (
            <Button type="button" className="rounded-lg" onClick={() => navigate("/doctors/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Doctor
            </Button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="grid gap-4 rounded-lg border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-xl md:grid-cols-4 lg:grid-cols-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Speciality</label>
            <Select value={selectedSpecialityId} onValueChange={setSelectedSpecialityId}>
              <SelectTrigger className="rounded-lg bg-white/50">
                <SelectValue placeholder="All Specialities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specialities</SelectItem>
                {specialities.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Category</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="rounded-lg bg-white/50">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="super">Super</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">HOD Status</label>
            <Select value={selectedHod} onValueChange={setSelectedHod}>
              <SelectTrigger className="rounded-lg bg-white/50">
                <SelectValue placeholder="All Doctors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Doctors</SelectItem>
                <SelectItem value="true">HOD Only</SelectItem>
                <SelectItem value="false">Non-HOD Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="ghost"
              className="h-10 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters && !search}
            >
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-white/60 bg-white/80 shadow-sm backdrop-blur-xl">
        {isLoading ? (
          <div className="py-12 text-center text-sm font-medium text-slate-500">Loading doctors...</div>
        ) : doctors.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">No doctors found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Doctor</th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Experience</th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">HOD</th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Order</th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Specialities</th>
                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedDoctors.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-4">
                        <div className="h-16 w-16 overflow-hidden rounded-lg bg-slate-100">
                          <img
                            src={item.image_url || DEFAULT_DOCTOR_IMAGE_URL}
                            alt={item.name || "Doctor image"}
                            className="h-full w-full object-cover"
                            onError={(event) => {
                              const target = event.currentTarget;
                              if (target.src !== DEFAULT_DOCTOR_IMAGE_URL) {
                                target.src = DEFAULT_DOCTOR_IMAGE_URL;
                              }
                            }}
                          />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-800">{item.name}</div>
                          <div className="text-sm text-slate-500">{item.designation}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{item.experience}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {item.is_hod ? (
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">HOD</Badge>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{item.display_order ?? 0}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {(item.specialities || []).map((speciality) => (
                          <Badge key={`${item.id}-${speciality.id}`} variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                            {speciality.title}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" className="rounded-lg" onClick={() => navigate(`/doctors/${item.id}/edit`)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <DeleteConfirmationButton onConfirm={() => handleDelete(item)}>
<Button type="button" variant="outline" className="rounded-lg border-red-200 text-red-600 hover:bg-red-50">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
</DeleteConfirmationButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Doctors;
