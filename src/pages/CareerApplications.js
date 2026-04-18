import React, { useEffect, useState } from "react";
import { ExternalLink, FileText, RefreshCw } from "lucide-react";
import { Button } from "../components/ui/button";
import useToast from "../hooks/useToast";
import apiClient from "../lib/utils/network-client";

const CareerApplications = () => {
  const { showErrorToast } = useToast();
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/career/applications");
      setApplications(response.data?.data?.applications || []);
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Failed to load applications");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  return (
    <div className="max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Career Applications</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Review applications submitted from the frontend career form.</p>
        </div>
        <Button type="button" variant="outline" className="rounded-xl" onClick={fetchApplications}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-sm backdrop-blur-xl">
        {isLoading ? (
          <div className="py-12 text-center text-sm font-medium text-slate-500">Loading applications...</div>
        ) : applications.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">No applications found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Applicant</th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Position</th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">City</th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Message</th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Resume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      <div className="font-semibold text-slate-800">{item.name}</div>
                      <div>{item.email}</div>
                      <div>{item.contact_no}</div>
                      <div className="mt-1 text-xs text-slate-400">{String(item.created_at).slice(0, 19).replace("T", " ")}</div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{item.position}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{item.city}</td>
                    <td className="px-5 py-4 text-sm text-slate-600"><div className="line-clamp-3">{item.message || "-"}</div></td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      <a href={item.resume_url} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
                        <FileText className="mr-2 h-3.5 w-3.5" />
                        Open Resume
                        <ExternalLink className="ml-2 h-3.5 w-3.5" />
                      </a>
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

export default CareerApplications;
