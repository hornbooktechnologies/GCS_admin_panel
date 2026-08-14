import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Pencil, Plus, RefreshCw, Scale, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { DeleteConfirmationButton } from "../components/common/ConfirmationDialog";
import { useAuthStore } from "../context/AuthContext";
import useToast from "../hooks/useToast";
import { hasPermission } from "../lib/utils/permissions";
import apiClient from "../lib/utils/network-client";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const numberFormatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 3 });

const BioMedicalWaste = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showErrorToast, showSuccessToast } = useToast();
  const [records, setRecords] = useState([]);
  const [yearFilter, setYearFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const canCreate = hasPermission(user, "bio-medical-waste", "create");
  const canEdit = hasPermission(user, "bio-medical-waste", "edit");
  const canDelete = hasPermission(user, "bio-medical-waste", "delete");

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/bio-medical-waste/admin");
      setRecords(response.data?.data?.records || []);
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Failed to load biomedical waste records");
    } finally {
      setIsLoading(false);
    }
  }, [showErrorToast]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const years = useMemo(
    () => [...new Set(records.map((record) => Number(record.report_year)))].sort((a, b) => b - a),
    [records],
  );
  const visibleRecords = yearFilter === "all"
    ? records
    : records.filter((record) => Number(record.report_year) === Number(yearFilter));
  const publishedCount = records.filter((record) => record.status === "published").length;
  const totalKg = visibleRecords.reduce((sum, record) => sum + Number(record.total_kg || 0), 0);

  const handleDelete = async (record) => {
    try {
      await apiClient.delete(`/bio-medical-waste/${record.id}`);
      showSuccessToast("Biomedical waste record deleted successfully");
      fetchRecords();
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to delete biomedical waste record");
    }
  };

  return (
    <div className="max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Biomedical Waste</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Publish the monthly figures displayed on the hospital website.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="h-10 w-[170px] bg-white font-semibold" aria-label="Filter by year">
              <span className="flex min-w-0 items-center gap-2">
                <CalendarDays className="h-4 w-4 shrink-0 text-blue-600" />
                <SelectValue placeholder="All years" />
              </span>
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">All years</SelectItem>
              {years.map((year) => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" className="rounded-lg" onClick={fetchRecords}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          {canCreate && (
            <Button type="button" className="rounded-lg" onClick={() => navigate("/bio-medical-waste/new")}>
              <Plus className="mr-2 h-4 w-4" /> Add Monthly Record
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Total records", records.length, "All saved months"],
          ["Published", publishedCount, "Visible on public page"],
          ["Filtered total", `${numberFormatter.format(totalKg)} kg`, yearFilter === "all" ? "Across all years" : `For ${yearFilter}`],
        ].map(([label, value, detail]) => (
          <div key={label} className="rounded-xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-xl">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <Scale className="h-4 w-4" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{detail}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-white/60 bg-white/80 shadow-sm backdrop-blur-xl">
        {isLoading ? (
          <div className="py-12 text-center text-sm font-medium text-slate-500">Loading biomedical waste records...</div>
        ) : visibleRecords.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">No records found for this selection.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1050px] w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  {["Period", "Red (kg)", "Yellow (kg)", "Blue (kg)", "White (kg)", "Total (kg)", "Status", "Actions"].map((heading) => (
                    <th key={heading} className={`px-4 py-4 text-xs font-bold uppercase tracking-[0.12em] text-slate-500 ${heading === "Actions" ? "text-right" : "text-left"}`}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleRecords.map((record) => (
                  <tr key={record.id} className="transition hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-4 py-4 text-sm font-bold text-slate-800">
                      {MONTHS[Number(record.report_month) - 1]} {record.report_year}
                    </td>
                    {["red_kg", "yellow_kg", "blue_kg", "white_kg", "total_kg"].map((field) => (
                      <td key={field} className="px-4 py-4 text-sm tabular-nums text-slate-700">
                        {numberFormatter.format(Number(record[field]))}
                      </td>
                    ))}
                    <td className="px-4 py-4">
                      <Badge className={record.status === "published" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>
                        {record.status === "published" ? "Published" : "Draft"}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        {canEdit && (
                          <Button type="button" variant="outline" className="rounded-lg" onClick={() => navigate(`/bio-medical-waste/${record.id}/edit`)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </Button>
                        )}
                        {canDelete && (
                          <DeleteConfirmationButton onConfirm={() => handleDelete(record)}>
                            <Button type="button" variant="outline" className="rounded-lg border-red-200 text-red-600 hover:bg-red-50">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </Button>
                          </DeleteConfirmationButton>
                        )}
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

export default BioMedicalWaste;
