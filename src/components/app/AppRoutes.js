import React from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import Login from "../../pages/auth/Login";
import ActivityLogs from "../../pages/ActivityLogs";
import AdvertisementBanner from "../../pages/AdvertisementBanner";
import Announcements from "../../pages/Announcements";
import AwardCreate from "../../pages/AwardCreate";
import AwardEdit from "../../pages/AwardEdit";
import Awards from "../../pages/Awards";
import Banners from "../../pages/Banners";
import BlogCreate from "../../pages/BlogCreate";
import BlogEdit from "../../pages/BlogEdit";
import Blogs from "../../pages/Blogs";
import CampusLife from "../../pages/CampusLife";
import CampusLifeCreate from "../../pages/CampusLifeCreate";
import CampusLifeEdit from "../../pages/CampusLifeEdit";
import Career from "../../pages/Career";
import CareerApplications from "../../pages/CareerApplications";
import CareerCurrentOpeningCreate from "../../pages/CareerCurrentOpeningCreate";
import CareerCurrentOpeningEdit from "../../pages/CareerCurrentOpeningEdit";
import CareerCurrentOpenings from "../../pages/CareerCurrentOpenings";
import CareerInternshipPositionCreate from "../../pages/CareerInternshipPositionCreate";
import CareerInternshipPositionEdit from "../../pages/CareerInternshipPositionEdit";
import CareerInternshipPositions from "../../pages/CareerInternshipPositions";
import CareerTeachingPositionCreate from "../../pages/CareerTeachingPositionCreate";
import CareerTeachingPositionEdit from "../../pages/CareerTeachingPositionEdit";
import CareerTeachingPositions from "../../pages/CareerTeachingPositions";
import CheckupPlanCreate from "../../pages/CheckupPlanCreate";
import CheckupPlanEdit from "../../pages/CheckupPlanEdit";
import CheckupPlans from "../../pages/CheckupPlans";
import CommitteeCreate from "../../pages/CommitteeCreate";
import CommitteeEdit from "../../pages/CommitteeEdit";
import CommitteeMembers from "../../pages/CommitteeMembers";
import Committees from "../../pages/Committees";
import Dashboard from "../../pages/Dashboard";
import DoctorCreate from "../../pages/DoctorCreate";
import DoctorEdit from "../../pages/DoctorEdit";
import Doctors from "../../pages/Doctors";
import DoctorTestimonials from "../../pages/DoctorTestimonials";
import DownloadCreate from "../../pages/DownloadCreate";
import DownloadEdit from "../../pages/DownloadEdit";
import Downloads from "../../pages/Downloads";
import EventCreate from "../../pages/EventCreate";
import EventEdit from "../../pages/EventEdit";
import Events from "../../pages/Events";
import Facilities from "../../pages/Facilities";
import FacilityCreate from "../../pages/FacilityCreate";
import FacilityEdit from "../../pages/FacilityEdit";
import GovernmentSchemeCreate from "../../pages/GovernmentSchemeCreate";
import GovernmentSchemeEdit from "../../pages/GovernmentSchemeEdit";
import GovernmentSchemes from "../../pages/GovernmentSchemes";
import HealthCampCreate from "../../pages/HealthCampCreate";
import HealthCampEdit from "../../pages/HealthCampEdit";
import HealthCamps from "../../pages/HealthCamps";
import JournalCreate from "../../pages/JournalCreate";
import JournalEdit from "../../pages/JournalEdit";
import Journals from "../../pages/Journals";
import JourneyMilestoneCreate from "../../pages/JourneyMilestoneCreate";
import JourneyMilestoneEdit from "../../pages/JourneyMilestoneEdit";
import JourneyMilestones from "../../pages/JourneyMilestones";
import News from "../../pages/News";
import NewsCreate from "../../pages/NewsCreate";
import NewsEdit from "../../pages/NewsEdit";
import NewsletterCreate from "../../pages/NewsletterCreate";
import NewsletterEdit from "../../pages/NewsletterEdit";
import Newsletters from "../../pages/Newsletters";
import NotFound from "../../pages/NotFound";
import PatientTestimonials from "../../pages/PatientTestimonials";
import ResultCreate from "../../pages/ResultCreate";
import ResultEdit from "../../pages/ResultEdit";
import Results from "../../pages/Results";
import RolesPermissions from "../../pages/RolesPermissions";
import SocialProfiles from "../../pages/SocialProfiles";
import Specialities from "../../pages/Specialities";
import SpecialityCreate from "../../pages/SpecialityCreate";
import SpecialityEdit from "../../pages/SpecialityEdit";
import StudentTestimonialCreate from "../../pages/StudentTestimonialCreate";
import StudentTestimonialEdit from "../../pages/StudentTestimonialEdit";
import StudentTestimonials from "../../pages/StudentTestimonials";
import SympotmCreate from "../../pages/SympotmCreate";
import SympotmEdit from "../../pages/SympotmEdit";
import Sympotms from "../../pages/Sympotms";
import Team from "../../pages/Team";
import TeamCategories from "../../pages/TeamCategories";
import TeamCategoryCreate from "../../pages/TeamCategoryCreate";
import TeamCategoryEdit from "../../pages/TeamCategoryEdit";
import TeamCreate from "../../pages/TeamCreate";
import TeamEdit from "../../pages/TeamEdit";
import Users from "../../pages/Users";
import { useAuthStore } from "../../context/AuthContext";
import { LayoutProvider } from "../../context/LayoutContext";
import ProtectedAppLayout from "./ProtectedAppLayout";

const protectedRoutes = [
  { path: "/dashboard", Component: Dashboard },
  { path: "/users", Component: Users },
  { path: "/banners", Component: Banners },
  { path: "/doctor-testimonials", Component: DoctorTestimonials },
  { path: "/patient-testimonials", Component: PatientTestimonials },
  { path: "/social-profiles", Component: SocialProfiles },
  { path: "/announcements", Component: Announcements },
  { path: "/advertisement-banner", Component: AdvertisementBanner },
  { path: "/events", Component: Events },
  { path: "/events/new", Component: EventCreate },
  { path: "/events/:eventId/edit", Component: EventEdit },
  { path: "/newsletters", Component: Newsletters },
  { path: "/newsletters/new", Component: NewsletterCreate },
  { path: "/newsletters/:newsletterId/edit", Component: NewsletterEdit },
  { path: "/career", Component: Career },
  { path: "/career/current-openings", Component: CareerCurrentOpenings },
  {
    path: "/career/current-openings/new",
    Component: CareerCurrentOpeningCreate,
  },
  {
    path: "/career/current-openings/:id/edit",
    Component: CareerCurrentOpeningEdit,
  },
  { path: "/career/applications", Component: CareerApplications },
  { path: "/career/teaching-positions", Component: CareerTeachingPositions },
  {
    path: "/career/teaching-positions/new",
    Component: CareerTeachingPositionCreate,
  },
  {
    path: "/career/teaching-positions/:id/edit",
    Component: CareerTeachingPositionEdit,
  },
  {
    path: "/career/internship-positions",
    Component: CareerInternshipPositions,
  },
  {
    path: "/career/internship-positions/new",
    Component: CareerInternshipPositionCreate,
  },
  {
    path: "/career/internship-positions/:id/edit",
    Component: CareerInternshipPositionEdit,
  },
  { path: "/downloads", Component: Downloads },
  { path: "/downloads/new", Component: DownloadCreate },
  { path: "/downloads/:downloadId/edit", Component: DownloadEdit },
  { path: "/master/team-categories", Component: TeamCategories },
  { path: "/master/team-categories/new", Component: TeamCategoryCreate },
  { path: "/master/team-categories/:id/edit", Component: TeamCategoryEdit },
  { path: "/team", Component: Team },
  { path: "/team/new", Component: TeamCreate },
  { path: "/team/:id/edit", Component: TeamEdit },
  { path: "/committees", Component: Committees },
  { path: "/committees/new", Component: CommitteeCreate },
  { path: "/committees/:id/edit", Component: CommitteeEdit },
  { path: "/committees/:id/members", Component: CommitteeMembers },
  { path: "/awards", Component: Awards },
  { path: "/awards/new", Component: AwardCreate },
  { path: "/awards/:awardId/edit", Component: AwardEdit },
  { path: "/news", Component: News },
  { path: "/news/new", Component: NewsCreate },
  { path: "/news/:newsId/edit", Component: NewsEdit },
  { path: "/health-camps", Component: HealthCamps },
  { path: "/health-camps/new", Component: HealthCampCreate },
  { path: "/health-camps/:id/edit", Component: HealthCampEdit },
  { path: "/checkup-plans", Component: CheckupPlans },
  { path: "/checkup-plans/new", Component: CheckupPlanCreate },
  { path: "/checkup-plans/:id/edit", Component: CheckupPlanEdit },
  { path: "/results", Component: Results },
  { path: "/results/new", Component: ResultCreate },
  { path: "/results/:id/edit", Component: ResultEdit },
  { path: "/campus-life", Component: CampusLife },
  { path: "/campus-life/new", Component: CampusLifeCreate },
  { path: "/campus-life/:id/edit", Component: CampusLifeEdit },
  { path: "/student-testimonials", Component: StudentTestimonials },
  {
    path: "/student-testimonials/new",
    Component: StudentTestimonialCreate,
  },
  {
    path: "/student-testimonials/:id/edit",
    Component: StudentTestimonialEdit,
  },
  { path: "/facilities", Component: Facilities },
  { path: "/facilities/new", Component: FacilityCreate },
  { path: "/facilities/:id/edit", Component: FacilityEdit },
  { path: "/government-schemes", Component: GovernmentSchemes },
  { path: "/government-schemes/new", Component: GovernmentSchemeCreate },
  {
    path: "/government-schemes/:id/edit",
    Component: GovernmentSchemeEdit,
  },
  { path: "/journals", Component: Journals },
  { path: "/journals/new", Component: JournalCreate },
  { path: "/journals/:id/edit", Component: JournalEdit },
  { path: "/journey-milestones", Component: JourneyMilestones },
  { path: "/journey-milestones/new", Component: JourneyMilestoneCreate },
  { path: "/journey-milestones/:id/edit", Component: JourneyMilestoneEdit },
  { path: "/specialities", Component: Specialities },
  { path: "/specialities/new", Component: SpecialityCreate },
  { path: "/specialities/:specialityId/edit", Component: SpecialityEdit },
  { path: "/doctors", Component: Doctors },
  { path: "/doctors/new", Component: DoctorCreate },
  { path: "/doctors/:doctorId/edit", Component: DoctorEdit },
  { path: "/symptoms", Component: Sympotms },
  { path: "/symptoms/new", Component: SympotmCreate },
  { path: "/symptoms/:id/edit", Component: SympotmEdit },
  { path: "/sympotms", Component: Sympotms },
  { path: "/sympotms/new", Component: SympotmCreate },
  { path: "/sympotms/:id/edit", Component: SympotmEdit },
  { path: "/blogs", Component: Blogs },
  { path: "/blogs/new", Component: BlogCreate },
  { path: "/blogs/:blogId/edit", Component: BlogEdit },
  { path: "/activity-logs", Component: ActivityLogs },
  { path: "/roles", Component: RolesPermissions },
  { path: "/permission", Component: RolesPermissions },
];

const AppRoutes = () => {
  const { tokens } = useAuthStore();

  return (
    <Router>
      <LayoutProvider>
        <Routes>
          <Route path="/auth/login" element={<Login />} />

          <Route element={<ProtectedAppLayout />}>
            <Route
              path="/"
              element={
                tokens ? <Dashboard /> : <Navigate to="/dashboard" replace />
              }
            />

            {protectedRoutes.map(({ path, Component }) => (
              <Route key={path} path={path} element={<Component />} />
            ))}

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </LayoutProvider>
    </Router>
  );
};

export default AppRoutes;
