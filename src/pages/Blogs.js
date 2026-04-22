import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  GripVertical,
  Image as ImageIcon,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  UserRound,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuthStore } from "../context/AuthContext";
import { hasPermission } from "../lib/utils/permissions";
import useToast from "../hooks/useToast";
import apiClient from "../lib/utils/network-client";

const Blogs = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showErrorToast, showSuccessToast } = useToast();
  const canCreate = hasPermission(user, "blogs", "create");
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReordering, setIsReordering] = useState(false);
  const [draggedBlogId, setDraggedBlogId] = useState(null);
  const [dropTargetBlogId, setDropTargetBlogId] = useState(null);

  const isAdmin = hasPermission(user, "blogs", "list");

  const fetchBlogs = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/blogs");
      setBlogs(response.data?.data?.blogs || []);
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Failed to load blog data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchBlogs();
    }
  }, [isAdmin]);

  const handleDelete = async (blog) => {
    const confirmed = window.confirm(
      `Delete blog "${blog.title}"? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await apiClient.delete(`/blogs/${blog.id}`);
      showSuccessToast("Blog deleted successfully");
      fetchBlogs();
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to delete blog");
    }
  };

  const persistBlogOrder = async (orderedBlogs) => {
    setIsReordering(true);
    try {
      await apiClient.put("/blogs/reorder", {
        orderedItems: orderedBlogs.map((blog, index) => ({
          id: blog.id,
          display_order: index + 1,
        })),
      });

      showSuccessToast("Blog order updated successfully");
      setBlogs(
        orderedBlogs.map((blog, index) => ({
          ...blog,
          display_order: index + 1,
        })),
      );
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to update blog order");
      fetchBlogs();
    } finally {
      setIsReordering(false);
      setDraggedBlogId(null);
      setDropTargetBlogId(null);
    }
  };

  const handleDropCard = async (event, targetBlogId) => {
    event.preventDefault();

    if (!draggedBlogId || draggedBlogId === targetBlogId) {
      setDraggedBlogId(null);
      setDropTargetBlogId(null);
      return;
    }

    const draggedIndex = blogs.findIndex((blog) => blog.id === draggedBlogId);
    const targetIndex = blogs.findIndex((blog) => blog.id === targetBlogId);

    if (draggedIndex < 0 || targetIndex < 0) {
      setDraggedBlogId(null);
      setDropTargetBlogId(null);
      return;
    }

    const reordered = [...blogs];
    const [movedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, movedItem);
    setBlogs(reordered);
    await persistBlogOrder(reordered);
  };

  if (!isAdmin) {
    return (
      <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Blogs</h1>
        <p className="mt-2 text-sm text-slate-500">
          Blog management is only available for admin users.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Blog Management
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Manage blog content, images, and author details.
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Drag cards to reorder blogs
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={fetchBlogs}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {canCreate && (

            <Button
            type="button"
            className="rounded-xl"
            onClick={() => navigate("/blogs/new")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Blog
          </Button>

          )}
        </div>
      </div>

      <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
        {isLoading ? (
          <div className="py-12 text-center text-sm font-medium text-slate-500">
            Loading blogs...
          </div>
        ) : blogs.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <ImageIcon className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">
              No blogs found
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Create your first blog to populate this module.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {blogs.map((blog) => (
              <div
                key={blog.id}
                draggable={!isReordering}
                onDragStart={() => setDraggedBlogId(blog.id)}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (draggedBlogId && draggedBlogId !== blog.id) {
                    setDropTargetBlogId(blog.id);
                  }
                }}
                onDrop={(event) => handleDropCard(event, blog.id)}
                onDragEnd={() => {
                  setDraggedBlogId(null);
                  setDropTargetBlogId(null);
                }}
                className={`overflow-hidden rounded-3xl border bg-white shadow-sm transition-all duration-200 ${
                  draggedBlogId === blog.id
                    ? "scale-[0.98] border-primary/40 opacity-60"
                    : dropTargetBlogId === blog.id
                      ? "border-primary ring-2 ring-primary/10 shadow-lg shadow-primary/10"
                      : "border-slate-100"
                }`}
              >
                <div className="grid gap-0 md:grid-cols-[220px_1fr]">
                  <div className="bg-slate-100">
                    {blog.thumbnail_image_url ? (
                      <img
                        src={blog.thumbnail_image_url}
                        alt={blog.title}
                        className="h-full w-full object-cover"
                      />
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
                          <h2 className="truncate text-lg font-bold text-slate-800">
                            {blog.title}
                          </h2>
                          <p className="mt-1 text-xs font-medium text-slate-500">
                            Order: {blog.display_order ?? "-"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500">
                      <div className="inline-flex items-center gap-2">
                        <UserRound className="h-4 w-4" />
                        <span>{blog.author_name}</span>
                      </div>
                      <div className="inline-flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{String(blog.blog_date).slice(0, 10)}</span>
                      </div>
                    </div>

                    <p className="text-sm text-slate-500">
                      {blog.author_designation}
                    </p>

                    <div
                      className="line-clamp-3 text-sm text-slate-600"
                      dangerouslySetInnerHTML={{ __html: blog.description }}
                    />

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => navigate(`/blogs/${blog.id}/edit`)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(blog)}
                      >
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

export default Blogs;
