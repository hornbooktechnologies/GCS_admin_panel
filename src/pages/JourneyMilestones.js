import React, { useCallback, useEffect, useState } from "react";
import { GripVertical, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DeleteConfirmationButton } from "../components/common/ConfirmationDialog";
import { Button } from "../components/ui/button";
import { useAuthStore } from "../context/AuthContext";
import useToast from "../hooks/useToast";
import { hasPermission } from "../lib/utils/permissions";
import apiClient from "../lib/utils/network-client";

const toLabel = (value) => String(value || "").replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const JourneyMilestones = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showErrorToast, showSuccessToast } = useToast();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedId, setDraggedId] = useState(null);
  const [isReordering, setIsReordering] = useState(false);
  const canCreate = hasPermission(user, "journey-milestones", "create");
  const canEdit = hasPermission(user, "journey-milestones", "edit");
  const canDelete = hasPermission(user, "journey-milestones", "delete");

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/journey-milestones/admin/all");
      setItems(response.data?.data?.milestones || []);
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Failed to load journey milestones");
    } finally {
      setIsLoading(false);
    }
  }, [showErrorToast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDelete = async (item) => {
    try {
      await apiClient.delete(`/journey-milestones/${item.id}`);
      showSuccessToast("Journey milestone deleted successfully");
      fetchItems();
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to delete journey milestone");
    }
  };

  const handleDrop = async (targetId) => {
    if (!canEdit || !draggedId || draggedId === targetId || isReordering) {
      setDraggedId(null);
      return;
    }

    const previousItems = items;
    const nextItems = [...items];
    const sourceIndex = nextItems.findIndex((item) => item.id === draggedId);
    const targetIndex = nextItems.findIndex((item) => item.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) {
      setDraggedId(null);
      return;
    }

    const [movedItem] = nextItems.splice(sourceIndex, 1);
    nextItems.splice(targetIndex, 0, movedItem);
    setItems(nextItems);
    setDraggedId(null);
    setIsReordering(true);

    try {
      const response = await apiClient.put("/journey-milestones/reorder", {
        milestone_ids: nextItems.map((item) => item.id),
      });
      setItems(response.data?.data?.milestones || nextItems);
      showSuccessToast("Journey order updated successfully");
    } catch (err) {
      setItems(previousItems);
      showErrorToast(err.response?.data?.message || "Unable to update journey order");
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <div className="max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Our Journey</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Drag milestones into the order you want to show on the public Overview page.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" className="rounded-lg" onClick={fetchItems} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {canCreate && (
            <Button type="button" className="rounded-lg" onClick={() => navigate("/journey-milestones/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Milestone
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-white/60 bg-white/80 shadow-sm backdrop-blur-xl">
        {isLoading ? (
          <div className="p-12 text-center text-sm font-medium text-slate-500">Loading journey milestones...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">No journey milestones found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4">Reorder</th>
                  <th className="px-5 py-4">Year</th>
                  <th className="px-5 py-4">Events</th>
                  <th className="px-5 py-4">Icon</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, index) => (
                  <tr
                    key={item.id}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={() => handleDrop(item.id)}
                    className={`align-top transition-colors ${draggedId === item.id ? "bg-blue-50/80 opacity-60" : "hover:bg-slate-50/60"}`}
                  >
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        draggable={canEdit && !isReordering}
                        onDragStart={(event) => {
                          setDraggedId(item.id);
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData("text/plain", item.id);
                        }}
                        onDragEnd={() => setDraggedId(null)}
                        disabled={!canEdit || isReordering}
                        aria-label={`Move milestone ${item.year}`}
                        title="Drag to reorder"
                        className="inline-flex cursor-grab items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800 active:cursor-grabbing disabled:cursor-wait"
                      >
                        <GripVertical className="h-5 w-5" />
                        <span>{index + 1}</span>
                      </button>
                    </td>
                    <td className="px-5 py-4 text-lg font-black text-slate-900">{item.year}</td>
                    <td className="max-w-xl px-5 py-4">
                      <div className="space-y-1.5">
                        {(item.events || []).map((event) => (
                          <div key={event.id || event.title}>
                            <p className="text-sm font-bold text-slate-800">{event.title}</p>
                            <p className="line-clamp-1 text-xs text-slate-500">{event.description}</p>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      <p className="font-semibold">{toLabel(item.icon_key)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${item.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {toLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {canEdit && (
                          <Button type="button" variant="outline" className="rounded-lg" onClick={() => navigate(`/journey-milestones/${item.id}/edit`)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </Button>
                        )}
                        {canDelete && (
                          <DeleteConfirmationButton onConfirm={() => handleDelete(item)}>
                            <Button type="button" variant="outline" className="rounded-lg border-red-200 text-red-600 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
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

export default JourneyMilestones;
