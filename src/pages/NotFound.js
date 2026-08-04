import React from "react";
import { ArrowLeft, Home, SearchX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[calc(100dvh-9rem)] items-center justify-center py-8">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/70 bg-white/85 px-6 py-12 text-center shadow-2xl shadow-slate-300/40 backdrop-blur-xl sm:px-10 md:py-16">
        <div className="pointer-events-none absolute -left-16 -top-20 size-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 size-64 rounded-full bg-emerald-300/15 blur-3xl" />

        <div className="relative">
          <div className="mx-auto flex size-20 items-center justify-center rounded-3xl border border-primary/15 bg-primary/10 text-primary shadow-lg shadow-primary/10">
            <SearchX className="h-9 w-9" />
          </div>

          <p className="mt-7 text-sm font-black uppercase tracking-[0.28em] text-primary">
            Error 404
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Page not found
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
            This admin page may have been removed, renamed, or the address may be incorrect.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button type="button" variant="outline" className="whitespace-nowrap rounded-lg" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button type="button" className="whitespace-nowrap rounded-lg px-5" onClick={() => navigate("/dashboard", { replace: true })}>
              <Home className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
