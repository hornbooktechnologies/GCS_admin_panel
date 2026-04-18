import React from "react";
import { useNavigate } from "react-router-dom";
import { BriefcaseBusiness, FileUser, GraduationCap, School } from "lucide-react";
import { Button } from "../components/ui/button";

const cards = [
  {
    title: "Current Openings",
    description: "Manage available job openings and their requirements.",
    path: "/career/current-openings",
    icon: BriefcaseBusiness,
  },
  {
    title: "Applications",
    description: "Review applications submitted from the website frontend.",
    path: "/career/applications",
    icon: FileUser,
  },
  {
    title: "Teaching Positions",
    description: "Manage title, image, and PDF for teaching position notices.",
    path: "/career/teaching-positions",
    icon: School,
  },
  {
    title: "Internship Positions",
    description: "Manage title, image, and PDF for internship position notices.",
    path: "/career/internship-positions",
    icon: GraduationCap,
  },
];

const Career = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-[1600px] space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Career</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Manage openings, public applications, teaching positions, and internship positions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">{card.title}</h2>
              <p className="mt-2 text-sm text-slate-500">{card.description}</p>
              <Button type="button" className="mt-5 rounded-xl" onClick={() => navigate(card.path)}>
                Open
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Career;
