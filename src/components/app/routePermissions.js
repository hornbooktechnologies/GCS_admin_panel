export const routePermissions = [
  { prefix: "/dashboard", moduleKey: "dashboard", action: "list" },
  { prefix: "/", moduleKey: "dashboard", action: "list", exact: true },
  { prefix: "/users", moduleKey: "users", action: "list" },
  { prefix: "/roles", moduleKey: "roles", action: "list" },
  { prefix: "/permission", moduleKey: "roles", action: "list" },
  { prefix: "/banners", moduleKey: "banners" },
  { prefix: "/doctor-testimonials", moduleKey: "doctor-testimonials" },
  { prefix: "/patient-testimonials", moduleKey: "patient-testimonials" },
  { prefix: "/social-profiles", moduleKey: "social-profiles" },
  { prefix: "/announcements", moduleKey: "announcements" },
  { prefix: "/advertisement-banner", moduleKey: "advertisement-banner" },
  { prefix: "/events", moduleKey: "events" },
  { prefix: "/newsletters", moduleKey: "newsletters" },
  { prefix: "/career", moduleKey: "career" },
  { prefix: "/downloads", moduleKey: "downloads" },
  { prefix: "/master/team-categories", moduleKey: "team-categories" },
  { prefix: "/team", moduleKey: "team" },
  { prefix: "/committees", moduleKey: "committees" },
  { prefix: "/awards", moduleKey: "awards" },
  { prefix: "/news", moduleKey: "news" },
  { prefix: "/health-camps", moduleKey: "health-camps" },
  { prefix: "/bio-medical-waste", moduleKey: "bio-medical-waste" },
  { prefix: "/checkup-plans", moduleKey: "checkup-plans" },
  { prefix: "/results", moduleKey: "results" },
  { prefix: "/campus-life", moduleKey: "campus-life" },
  { prefix: "/student-testimonials", moduleKey: "student-testimonials" },
  { prefix: "/facilities", moduleKey: "facilities" },
  { prefix: "/government-schemes", moduleKey: "government-schemes" },
  { prefix: "/journals", moduleKey: "journals" },
  { prefix: "/journey-milestones", moduleKey: "journey-milestones" },
  { prefix: "/specialities", moduleKey: "specialities" },
  { prefix: "/doctors", moduleKey: "doctors" },
  { prefix: "/symptoms", moduleKey: "symptoms" },
  { prefix: "/sympotms", moduleKey: "symptoms" },
  { prefix: "/blogs", moduleKey: "blogs" },
  { prefix: "/activity-logs", moduleKey: "activity-logs", action: "list" },
];

export const getRouteAction = (pathname, fallback = "list") => {
  if (pathname.endsWith("/new")) return "create";
  if (pathname.endsWith("/edit")) return "edit";
  return fallback;
};
