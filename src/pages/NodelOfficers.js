import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Image as ImageIcon, Mail, MapPin, Pencil, Phone, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import useToast from "../hooks/useToast";
import apiClient from "../lib/utils/network-client";

const NodelOfficers = () => {
  const navigate = useNavigate();
  const { showErrorToast, showSuccessToast } = useToast();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/nodel-officers");
      setItems(response.data?.data?.nodelOfficers || []);
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Failed to load nodel officers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`Delete "${item.name}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await apiClient.delete(`/nodel-officers/${item.id}`);
      showSuccessToast("Nodel officer deleted successfully");
      fetchItems();
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to delete nodel officer");
    }
  };

  return (
    <div className="max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Nodel Officers</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Manage officer profile, contact details, and address.</p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="rounded-xl" onClick={fetchItems}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button type="button" className="rounded-xl" onClick={() => navigate("/nodel-officers/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Nodel Officer
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
        {isLoading ? (
          <div className="py-12 text-center text-sm font-medium text-slate-500">Loading nodel officers...</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">No nodel officers found.</div>
        ) : (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {items.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
                <div className="grid gap-0 md:grid-cols-[220px_1fr]">
                  <div className="bg-slate-100">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="h-full min-h-64 w-full object-cover" />
                    ) : (
                      <div className="flex h-full min-h-64 items-center justify-center text-slate-400">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 p-5">
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">{item.name}</h2>
                      <p className="mt-1 text-sm font-semibold text-primary">{item.position}</p>
                    </div>

                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <span>{item.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                        <span>{item.phone_number}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                        <span>{item.email}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" className="rounded-xl" onClick={() => navigate(`/nodel-officers/${item.id}/edit`)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button type="button" variant="outline" className="rounded-xl border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleDelete(item)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NodelOfficers;
