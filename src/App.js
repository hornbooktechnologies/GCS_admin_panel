import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { Toaster } from "sonner";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import RolesPermissions from "./pages/RolesPermissions";
import ActivityLogs from "./pages/ActivityLogs";
import Banners from "./pages/Banners";
import DoctorTestimonials from "./pages/DoctorTestimonials";
import PatientTestimonials from "./pages/PatientTestimonials";
import SocialProfiles from "./pages/SocialProfiles";
import Announcements from "./pages/Announcements";
import Blogs from "./pages/Blogs";
import BlogCreate from "./pages/BlogCreate";
import BlogEdit from "./pages/BlogEdit";
import AdvertisementBanner from "./pages/AdvertisementBanner";
import Events from "./pages/Events";
import EventCreate from "./pages/EventCreate";
import EventEdit from "./pages/EventEdit";
import Newsletters from "./pages/Newsletters";
import NewsletterCreate from "./pages/NewsletterCreate";
import NewsletterEdit from "./pages/NewsletterEdit";
import Career from "./pages/Career";
import CareerCurrentOpenings from "./pages/CareerCurrentOpenings";
import CareerCurrentOpeningCreate from "./pages/CareerCurrentOpeningCreate";
import CareerCurrentOpeningEdit from "./pages/CareerCurrentOpeningEdit";
import CareerApplications from "./pages/CareerApplications";
import CareerTeachingPositions from "./pages/CareerTeachingPositions";
import CareerTeachingPositionCreate from "./pages/CareerTeachingPositionCreate";
import CareerTeachingPositionEdit from "./pages/CareerTeachingPositionEdit";
import CareerInternshipPositions from "./pages/CareerInternshipPositions";
import CareerInternshipPositionCreate from "./pages/CareerInternshipPositionCreate";
import CareerInternshipPositionEdit from "./pages/CareerInternshipPositionEdit";
import Downloads from "./pages/Downloads";
import DownloadCreate from "./pages/DownloadCreate";
import DownloadEdit from "./pages/DownloadEdit";
import TeamCategories from "./pages/TeamCategories";
import TeamCategoryCreate from "./pages/TeamCategoryCreate";
import TeamCategoryEdit from "./pages/TeamCategoryEdit";
import Team from "./pages/Team";
import TeamCreate from "./pages/TeamCreate";
import TeamEdit from "./pages/TeamEdit";
import Awards from "./pages/Awards";
import AwardCreate from "./pages/AwardCreate";
import AwardEdit from "./pages/AwardEdit";
import News from "./pages/News";
import NewsCreate from "./pages/NewsCreate";
import NewsEdit from "./pages/NewsEdit";
import HealthCamps from "./pages/HealthCamps";
import HealthCampCreate from "./pages/HealthCampCreate";
import HealthCampEdit from "./pages/HealthCampEdit";
import CheckupPlans from "./pages/CheckupPlans";
import CheckupPlanCreate from "./pages/CheckupPlanCreate";
import CheckupPlanEdit from "./pages/CheckupPlanEdit";
import NodelOfficers from "./pages/NodelOfficers";
import NodelOfficerCreate from "./pages/NodelOfficerCreate";
import NodelOfficerEdit from "./pages/NodelOfficerEdit";
import Results from "./pages/Results";
import ResultCreate from "./pages/ResultCreate";
import ResultEdit from "./pages/ResultEdit";
import CampusLife from "./pages/CampusLife";
import CampusLifeCreate from "./pages/CampusLifeCreate";
import CampusLifeEdit from "./pages/CampusLifeEdit";
import StudentTestimonials from "./pages/StudentTestimonials";
import StudentTestimonialCreate from "./pages/StudentTestimonialCreate";
import StudentTestimonialEdit from "./pages/StudentTestimonialEdit";
import Facilities from "./pages/Facilities";
import FacilityCreate from "./pages/FacilityCreate";
import FacilityEdit from "./pages/FacilityEdit";
import Journals from "./pages/Journals";
import JournalCreate from "./pages/JournalCreate";
import JournalEdit from "./pages/JournalEdit";
import NursingPhotoGallery from "./pages/NursingPhotoGallery";
import NursingPhotoGalleryCreate from "./pages/NursingPhotoGalleryCreate";
import NursingPhotoGalleryEdit from "./pages/NursingPhotoGalleryEdit";
import Specialities from "./pages/Specialities";
import SpecialityCreate from "./pages/SpecialityCreate";
import SpecialityEdit from "./pages/SpecialityEdit";
import Doctors from "./pages/Doctors";
import DoctorCreate from "./pages/DoctorCreate";
import DoctorEdit from "./pages/DoctorEdit";
import Sympotms from "./pages/Sympotms";
import SympotmCreate from "./pages/SympotmCreate";
import SympotmEdit from "./pages/SympotmEdit";
import PrivateRoute from "./components/guards/PrivateRoute";
import SidebarWrapper from "./components/shared/sidebar/SidebarWrapper";
import { AuthProvider, useAuthStore } from "./context/AuthContext";
import { LayoutProvider } from "./context/LayoutContext";
import { hasPermission } from "./lib/utils/permissions";

const routePermissions = [
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
  { prefix: "/awards", moduleKey: "awards" },
  { prefix: "/news", moduleKey: "news" },
  { prefix: "/health-camps", moduleKey: "health-camps" },
  { prefix: "/checkup-plans", moduleKey: "checkup-plans" },
  { prefix: "/nodel-officers", moduleKey: "nodel-officers" },
  { prefix: "/results", moduleKey: "results" },
  { prefix: "/campus-life", moduleKey: "campus-life" },
  { prefix: "/student-testimonials", moduleKey: "student-testimonials" },
  { prefix: "/facilities", moduleKey: "facilities" },
  { prefix: "/journals", moduleKey: "journals" },
  { prefix: "/nursing-photo-gallery", moduleKey: "nursing-photo-gallery" },
  { prefix: "/specialities", moduleKey: "specialities" },
  { prefix: "/doctors", moduleKey: "doctors" },
  { prefix: "/symptoms", moduleKey: "symptoms" },
  { prefix: "/sympotms", moduleKey: "symptoms" },
  { prefix: "/blogs", moduleKey: "blogs" },
  { prefix: "/activity-logs", moduleKey: "activity-logs", action: "list" },
];

const getRouteAction = (pathname, fallback = "list") => {
  if (pathname.endsWith("/new")) return "create";
  if (pathname.endsWith("/edit")) return "edit";
  return fallback;
};

const PermissionGate = ({ children }) => {
  const { user } = useAuthStore();
  const location = useLocation();
  const permission = routePermissions.find((item) =>
    item.exact ? location.pathname === item.prefix : location.pathname.startsWith(item.prefix),
  );

  if (!permission) return children;

  const action = getRouteAction(location.pathname, permission.action);
  if (hasPermission(user, permission.moduleKey, action)) {
    return children;
  }

  return (
    <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Access denied</h1>
      <p className="mt-2 text-sm text-slate-500">
        You do not have permission to access this module.
      </p>
    </div>
  );
};

function AppContent() {
  const { tokens } = useAuthStore();

  return (
    <>
      <Router>
        <LayoutProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/auth/login" element={<Login />} />

            {/* Protected Routes */}
            <Route
              element={
                <PrivateRoute>
                  <SidebarWrapper>
                    <PermissionGate>
                      <Outlet />
                    </PermissionGate>
                  </SidebarWrapper>
                </PrivateRoute>
              }
            >
              <Route
                path="/"
                element={
                  tokens ? <Dashboard /> : <Navigate to="/dashboard" replace />
                }
              />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/banners" element={<Banners />} />
              <Route
                path="/doctor-testimonials"
                element={<DoctorTestimonials />}
              />
              <Route
                path="/patient-testimonials"
                element={<PatientTestimonials />}
              />
              <Route path="/social-profiles" element={<SocialProfiles />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route
                path="/advertisement-banner"
                element={<AdvertisementBanner />}
              />
              <Route path="/events" element={<Events />} />
              <Route path="/events/new" element={<EventCreate />} />
              <Route path="/events/:eventId/edit" element={<EventEdit />} />
              <Route path="/newsletters" element={<Newsletters />} />
              <Route path="/newsletters/new" element={<NewsletterCreate />} />
              <Route
                path="/newsletters/:newsletterId/edit"
                element={<NewsletterEdit />}
              />
              <Route path="/career" element={<Career />} />
              <Route
                path="/career/current-openings"
                element={<CareerCurrentOpenings />}
              />
              <Route
                path="/career/current-openings/new"
                element={<CareerCurrentOpeningCreate />}
              />
              <Route
                path="/career/current-openings/:id/edit"
                element={<CareerCurrentOpeningEdit />}
              />
              <Route path="/career/applications" element={<CareerApplications />} />
              <Route
                path="/career/teaching-positions"
                element={<CareerTeachingPositions />}
              />
              <Route
                path="/career/teaching-positions/new"
                element={<CareerTeachingPositionCreate />}
              />
              <Route
                path="/career/teaching-positions/:id/edit"
                element={<CareerTeachingPositionEdit />}
              />
              <Route
                path="/career/internship-positions"
                element={<CareerInternshipPositions />}
              />
              <Route
                path="/career/internship-positions/new"
                element={<CareerInternshipPositionCreate />}
              />
              <Route
                path="/career/internship-positions/:id/edit"
                element={<CareerInternshipPositionEdit />}
              />
              <Route path="/downloads" element={<Downloads />} />
              <Route path="/downloads/new" element={<DownloadCreate />} />
              <Route path="/downloads/:downloadId/edit" element={<DownloadEdit />} />
              <Route path="/master/team-categories" element={<TeamCategories />} />
              <Route path="/master/team-categories/new" element={<TeamCategoryCreate />} />
              <Route path="/master/team-categories/:id/edit" element={<TeamCategoryEdit />} />
              <Route path="/team" element={<Team />} />
              <Route path="/team/new" element={<TeamCreate />} />
              <Route path="/team/:id/edit" element={<TeamEdit />} />
              <Route path="/awards" element={<Awards />} />
              <Route path="/awards/new" element={<AwardCreate />} />
              <Route path="/awards/:awardId/edit" element={<AwardEdit />} />
              <Route path="/news" element={<News />} />
              <Route path="/news/new" element={<NewsCreate />} />
              <Route path="/news/:newsId/edit" element={<NewsEdit />} />
              <Route path="/health-camps" element={<HealthCamps />} />
              <Route path="/health-camps/new" element={<HealthCampCreate />} />
              <Route path="/health-camps/:id/edit" element={<HealthCampEdit />} />
              <Route path="/checkup-plans" element={<CheckupPlans />} />
              <Route path="/checkup-plans/new" element={<CheckupPlanCreate />} />
              <Route path="/checkup-plans/:id/edit" element={<CheckupPlanEdit />} />
              <Route path="/nodel-officers" element={<NodelOfficers />} />
              <Route path="/nodel-officers/new" element={<NodelOfficerCreate />} />
              <Route path="/nodel-officers/:id/edit" element={<NodelOfficerEdit />} />
              <Route path="/results" element={<Results />} />
              <Route path="/results/new" element={<ResultCreate />} />
              <Route path="/results/:id/edit" element={<ResultEdit />} />
              <Route path="/campus-life" element={<CampusLife />} />
              <Route path="/campus-life/new" element={<CampusLifeCreate />} />
              <Route path="/campus-life/:id/edit" element={<CampusLifeEdit />} />
              <Route path="/student-testimonials" element={<StudentTestimonials />} />
              <Route path="/student-testimonials/new" element={<StudentTestimonialCreate />} />
              <Route path="/student-testimonials/:id/edit" element={<StudentTestimonialEdit />} />
              <Route path="/facilities" element={<Facilities />} />
              <Route path="/facilities/new" element={<FacilityCreate />} />
              <Route path="/facilities/:id/edit" element={<FacilityEdit />} />
              <Route path="/journals" element={<Journals />} />
              <Route path="/journals/new" element={<JournalCreate />} />
              <Route path="/journals/:id/edit" element={<JournalEdit />} />
              <Route path="/nursing-photo-gallery" element={<NursingPhotoGallery />} />
              <Route path="/nursing-photo-gallery/new" element={<NursingPhotoGalleryCreate />} />
              <Route path="/nursing-photo-gallery/:id/edit" element={<NursingPhotoGalleryEdit />} />
              <Route path="/specialities" element={<Specialities />} />
              <Route path="/specialities/new" element={<SpecialityCreate />} />
              <Route path="/specialities/:specialityId/edit" element={<SpecialityEdit />} />
              <Route path="/doctors" element={<Doctors />} />
              <Route path="/doctors/new" element={<DoctorCreate />} />
              <Route path="/doctors/:doctorId/edit" element={<DoctorEdit />} />
              <Route path="/symptoms" element={<Sympotms />} />
              <Route path="/symptoms/new" element={<SympotmCreate />} />
              <Route path="/symptoms/:id/edit" element={<SympotmEdit />} />
              <Route path="/sympotms" element={<Sympotms />} />
              <Route path="/sympotms/new" element={<SympotmCreate />} />
              <Route path="/sympotms/:id/edit" element={<SympotmEdit />} />
              <Route path="/blogs" element={<Blogs />} />
              <Route path="/blogs/new" element={<BlogCreate />} />
              <Route path="/blogs/:blogId/edit" element={<BlogEdit />} />
              <Route path="/activity-logs" element={<ActivityLogs />} />
              <Route path="/roles" element={<RolesPermissions />} />
              <Route path="/permission" element={<RolesPermissions />} />
            </Route>
          </Routes>
        </LayoutProvider>
      </Router>

      {/* Toast Notifications */}
      <Toaster position="top-right" richColors />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
