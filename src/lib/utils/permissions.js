export const PermissionActions = ["create", "list", "edit", "delete"];

export const PermissionModules = [
  { key: "dashboard", label: "Dashboard" },
  { key: "users", label: "Users" },
  { key: "roles", label: "Roles & Permissions" },
  { key: "banners", label: "Banners" },
  { key: "doctor-testimonials", label: "Doctor Testimonials" },
  { key: "patient-testimonials", label: "Patient Testimonials" },
  { key: "social-profiles", label: "Social Profiles" },
  { key: "announcements", label: "Announcements" },
  { key: "advertisement-banner", label: "Advertisement Banner" },
  { key: "events", label: "Events" },
  { key: "newsletters", label: "Newsletters" },
  { key: "career", label: "Career" },
  { key: "downloads", label: "Downloads" },
  { key: "team-categories", label: "Team Categories" },
  { key: "team", label: "Team" },
  { key: "awards", label: "Awards" },
  { key: "news", label: "News" },
  { key: "health-camps", label: "Health Camps" },
  { key: "checkup-plans", label: "Checkup Plans" },
  { key: "nodel-officers", label: "Nodel Officers" },
  { key: "results", label: "Results" },
  { key: "campus-life", label: "Campus Life" },
  { key: "student-testimonials", label: "Student Testimonials" },
  { key: "facilities", label: "Facilities" },
  { key: "journals", label: "Journals" },
  { key: "nursing-photo-gallery", label: "Nursing Photo Gallery" },
  { key: "specialities", label: "Specialities" },
  { key: "doctors", label: "Doctors" },
  { key: "symptoms", label: "Symptoms" },
  { key: "blogs", label: "Blogs" },
  { key: "activity-logs", label: "Activity Logs" },
];

export const hasPermission = (user, moduleKey, action = "list") => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return Boolean(user.permissions?.[moduleKey]?.[action]);
};
