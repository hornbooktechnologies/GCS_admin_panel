import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GripVertical, Image as ImageIcon, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuthStore } from "../context/AuthContext";
import useToast from "../hooks/useToast";
import apiClient from "../lib/utils/network-client";

const News = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showErrorToast, showSuccessToast } = useToast();
  const [newsItems, setNewsItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReordering, setIsReordering] = useState(false);
  const [draggedId, setDraggedId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);

  const isAdmin = user?.role === "admin";

  const fetchNews = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/news");
      setNewsItems(response.data?.data?.news || []);
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Failed to load news");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchNews();
    }
  }, [isAdmin]);

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`Delete "${item.name}"? This cannot be undone.`);
    if (!confirmed) return;
    try {
      await apiClient.delete(`/news/${item.id}`);
      showSuccessToast("News item deleted successfully");
      fetchNews();
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to delete news item");
    }
  };

  const persistOrder = async (orderedNews) => {
    setIsReordering(true);
    try {
      await apiClient.put("/news/reorder", {
        orderedItems: orderedNews.map((item, index) => ({
          id: item.id,
          display_order: index + 1,
        })),
      });
      showSuccessToast("News order updated successfully");
      setNewsItems(
        orderedNews.map((item, index) => ({
          ...item,
          display_order: index + 1,
        })),
      );
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to update news order");
      fetchNews();
    } finally {
      setIsReordering(false);
      setDraggedId(null);
      setDropTargetId(null);
    }
  };

  const handleDropCard = async (event, targetId) => {
    event.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDropTargetId(null);
      return;
    }

    const draggedIndex = newsItems.findIndex((item) => item.id === draggedId);
    const targetIndex = newsItems.findIndex((item) => item.id === targetId);
    if (draggedIndex < 0 || targetIndex < 0) {
      setDraggedId(null);
      setDropTargetId(null);
      return;
    }

    const reordered = [...newsItems];
    const [movedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, movedItem);
    setNewsItems(reordered);
    await persistOrder(reordered);
  };

  if (!isAdmin) {
    return (
      <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">News</h1>
        <p className="mt-2 text-sm text-slate-500">News management is only available for admin users.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">News</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Manage news items and drag cards to reorder them.</p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="rounded-xl" onClick={fetchNews}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button type="button" className="rounded-xl" onClick={() => navigate("/news/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add News
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
        {isLoading ? (
          <div className="py-12 text-center text-sm font-medium text-slate-500">Loading news...</div>
        ) : newsItems.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">No news items found.</div>
        ) : (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {newsItems.map((item) => (
              <div
                key={item.id}
                draggable={!isReordering}
                onDragStart={() => setDraggedId(item.id)}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (draggedId && draggedId !== item.id) {
                    setDropTargetId(item.id);
                  }
                }}
                onDrop={(event) => handleDropCard(event, item.id)}
                onDragEnd={() => {
                  setDraggedId(null);
                  setDropTargetId(null);
                }}
                className={`overflow-hidden rounded-3xl border bg-white shadow-sm transition-all duration-200 ${
                  draggedId === item.id
                    ? "scale-[0.98] border-primary/40 opacity-60"
                    : dropTargetId === item.id
                      ? "border-primary ring-2 ring-primary/10 shadow-lg shadow-primary/10"
                      : "border-slate-100"
                }`}
              >
                <div className="grid gap-0 md:grid-cols-[220px_1fr]">
                  <div className="bg-slate-100">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full min-h-48 items-center justify-center text-slate-400">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="mt-0.5 rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-400">
                          <GripVertical className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-bold text-slate-800">{item.name}</h2>
                          <p className="mt-1 text-xs font-medium text-slate-500">Order: {item.display_order ?? "-"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" className="rounded-xl" onClick={() => navigate(`/news/${item.id}/edit`)}>
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

export default News;
