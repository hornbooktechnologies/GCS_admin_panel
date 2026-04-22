import React, { useEffect, useState } from "react";
import { Skeleton } from "../ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../context/AuthContext";
import { Card, CardContent, CardHeader } from "../ui/card";
import {
  Calendar,
  Users,
  Clock,
  CalendarCheck,
  CalendarDays,
  Palmtree,
  UserCheck,
  UserRound,
  Microscope,
  HeartHandshake,
  Newspaper,
  CheckCircle,
  Gift,
  Cake,
  PartyPopper,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn } from "../../lib/utils/utils";
import { requestHandler } from "../../lib/utils/network-client";
import BirthdayCelebration from "./BirthdayCelebration";

const Dashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Dashboard stats state
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalEmployees: 0,
    totalDoctors: 0,
    totalSpecialities: 0,
    totalSymptoms: 0,
    totalBlogs: 0,
    pendingRequests: 0,
    totalHoliday: 0,
    currentMonthHoliday: 0,
    // Employee-specific fields
    total_leave_request: 0,
    pending: 0,
    totalLeavePending: 0,
    totalLeaveUsed: 0,
    rejectOrApproveLeave: 0,
  });

  // Employees on leave today list
  const [employeesOnLeaveToday, setEmployeesOnLeaveToday] = useState([]);

  // Upcoming holidays list
  const [upcomingHolidaysList, setUpcomingHolidaysList] = useState([]);

  // Todays birthdays list
  const [todaysBirthdays, setTodaysBirthdays] = useState([]);

  // Current Week Leaves list
  const [employeesOnLeaveWeek, setEmployeesOnLeaveWeek] = useState([]);
  // Year filter state checks
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());

  // Birthday Celebration State
  const [showBirthdayCelebration, setShowBirthdayCelebration] = useState(false);

  // Loading State
  const [isLoading, setIsLoading] = useState(true);

  // Generate year options (2021 to current year)
  const startYear = 2021;
  const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) =>
    (currentYear - i).toString(),
  );

  useEffect(() => {
    const fetchDashboard = async () => {
      setIsLoading(true);
      try {
        const response = await requestHandler("/dashboard", {
          method: "GET",
          params: { year: selectedYear },
        });
        if (response.success && response.data) {
          const data = response.data;
          setDashboardStats({
            totalUsers: data.total_users || 0,
            totalEmployees: data.total_employees || 0,
            totalDoctors: data.total_doctors || 0,
            totalSpecialities: data.total_specialities || 0,
            totalSymptoms: data.total_symptoms || 0,
            totalBlogs: data.total_blogs || 0,
            pendingRequests: data.pending_requests || 0,
            totalHoliday: data.total_holiday || 0,
            currentMonthHoliday: data.current_month_holiday || 0,
            total_leave_request: data.total_leave_request || 0,
            // Employee-specific fields
            pending: data.pending || 0,
            totalLeavePending: data.total_leave_pending || 0,
            totalLeaveUsed: data.total_leave_used || 0,
            rejectOrApproveLeave: data.reject_or_approve_leave || 0,
          });

          // Handle upcoming_holiday
          let holidays = [];
          if (data.upcoming_holiday) {
            if (Array.isArray(data.upcoming_holiday)) {
              holidays = data.upcoming_holiday;
            } else {
              holidays = [data.upcoming_holiday];
            }
          } else if (data.upcoming_holidays) {
            holidays = data.upcoming_holidays;
          }
          setUpcomingHolidaysList(holidays);

          // Handle employees on leave today
          if (
            data.employees_on_leave_today &&
            Array.isArray(data.employees_on_leave_today)
          ) {
            setEmployeesOnLeaveToday(data.employees_on_leave_today);
          } else {
            setEmployeesOnLeaveToday([]);
          }

          // Handle todays birthdays
          if (
            data.todays_birthdays &&
            Array.isArray(data.todays_birthdays)
          ) {
            setTodaysBirthdays(data.todays_birthdays);
          } else {
            setTodaysBirthdays([]);
          }

          // Handle employees upcoming leaves
          if (
            data.employees_upcoming_leaves &&
            Array.isArray(data.employees_upcoming_leaves)
          ) {
            setEmployeesOnLeaveWeek(data.employees_upcoming_leaves);
          } else if (
            data.employees_on_leave_week &&
            Array.isArray(data.employees_on_leave_week)
          ) {
            setEmployeesOnLeaveWeek(data.employees_on_leave_week);
          } else {
            setEmployeesOnLeaveWeek([]);
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, [user?.role, selectedYear]);

  // Check for User Birthday
  useEffect(() => {
    if (todaysBirthdays.length > 0 && user) {
      // Check if logged-in user is in the birthday list
      // Match user_id (User ID) against user.id (User ID), NOT the employee id (b.id)
      // DEBUG: Included hardcoded check for 'roshnipatelrp2002@gmail.com' for testing
      const isMyBirthday =
        user.email === 'roshnipatelrp2002@gmail.com' ||
        todaysBirthdays.some(
          (b) =>
            (b.user_id && String(b.user_id) === String(user.id)) ||
            b.email === user.email
        );

      // Show celebration if it matches
      if (isMyBirthday) {
        // Check if we've already shown it in this component mount cycle (using a ref would be better but state is fine for now)
        // User requested it to show effectively on every login/dashboard visit
        setShowBirthdayCelebration(true);
      }
    }
  }, [todaysBirthdays, user]);

  // Different stats for different roles
  const isEmployee = user?.role === "employee" || user?.role === "bde" || user?.role === "Bde";

  // Dynamic subtitle based on role
  const subtitle = isEmployee
    ? "Here's your leave summary and upcoming holidays."
    : "Overview of hospital website content and users.";

  // Format date helper
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Employee-specific stats (Leave focused) - Reordered for Layout
  const employeeStats = [
    {
      title: "Pending Request",
      value: dashboardStats.pending.toString(),
      icon: Clock,
      gradient: "from-orange-400 to-orange-600",
      description: "Awaiting approval",
      isSpecial: true,
    },
    {
      title: "Used Leave",
      value: (
        <span className="flex items-baseline">
          {dashboardStats.totalLeaveUsed}
          <span className="text-lg text-slate-400 font-medium ml-1">out of 14</span>
        </span>
      ),
      icon: CalendarCheck,
      gradient: "from-blue-400 to-blue-600",
      description: "Days taken this year",
      bgClass: "bg-blue-50",
      textClass: "text-primary",
    },
    {
      title: "Total Holidays",
      value: dashboardStats.totalHoliday.toString(),
      icon: Palmtree,
      gradient: "from-purple-400 to-purple-600",
      description: "Company holidays",
      bgClass: "bg-purple-50",
      textClass: "text-purple-600",
    },
    {
      title: "Current Month Holidays",
      value: dashboardStats.currentMonthHoliday.toString(),
      icon: Calendar,
      gradient: "from-pink-400 to-pink-600",
      description: "This month",
      bgClass: "bg-pink-50",
      textClass: "text-pink-600",
    },
    {
      title: "Remaining Leave",
      value: (14 - dashboardStats.totalLeaveUsed).toString(),
      icon: CheckCircle,
      gradient: "from-indigo-400 to-indigo-600",
      description: "Available balance",
      bgClass: "bg-indigo-50",
      textClass: "text-indigo-600",
    },

  ];

  // Admin/HR/Manager stats
  const adminStats = [
    {
      title: "Total Doctor",
      value: dashboardStats.totalDoctors.toString(),
      icon: UserRound,
      description: "Doctors listed",
      path: "/doctors",
      bgClass: "bg-emerald-50",
      textClass: "text-primary",
    },
    {
      title: "Total Specialities",
      value: dashboardStats.totalSpecialities.toString(),
      icon: Microscope,
      description: "Medical departments",
      path: "/specialities",
      bgClass: "bg-cyan-50",
      textClass: "text-cyan-600",
    },
    {
      title: "Total Users",
      value: dashboardStats.totalUsers.toString(),
      icon: Users,
      description: "Registered users",
      path: "/users",
      bgClass: "bg-purple-50",
      textClass: "text-purple-600",
    },
    {
      title: "Total Symptoms",
      value: dashboardStats.totalSymptoms.toString(),
      icon: HeartHandshake,
      description: "Symptoms listed",
      path: "/symptoms",
      bgClass: "bg-rose-50",
      textClass: "text-rose-600",
    },
    {
      title: "Total Blogs",
      value: dashboardStats.totalBlogs.toString(),
      icon: Newspaper,
      description: "Published articles",
      path: "/blogs",
      bgClass: "bg-amber-50",
      textClass: "text-amber-600",
    },
  ];

  // Select stats based on role
  const visibleStats = isEmployee ? employeeStats : adminStats;

  // Grid Configuration (Standardized to 4-Column Bento Layout)
  const gridClass = "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pb-8";
  const welcomeColSpan = "col-span-1 md:col-span-2";
  const upcomingHolidayColSpan = "col-span-1 md:col-span-2";
  const onLeaveTodayColSpan = "col-span-1 md:col-span-2";

  const renderStatCard = (stat, index) => {
    const Icon = stat.icon;

    // Special Style for "Pending Requests" (Orange Card)
    if (stat.isSpecial) {
      return (
        <div
          key={index}
          className={cn(
            "col-span-1 bg-white/80 backdrop-blur-xl rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-white/60",
            stat.path ? "cursor-pointer" : "cursor-default",
          )}
          onClick={() => stat.path && navigate(stat.path)}
        >
          <div className="absolute right-0 top-0 w-32 h-32 bg-orange-500/10 rounded-bl-full -mr-8 -mt-8"></div>
          <div className="flex justify-between items-start z-10">
            <div className="bg-orange-50 p-3 rounded-2xl text-orange-600">
              <Icon className="w-6 h-6" />
            </div>
            <span className="flex w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
          </div>
          <div className="mt-4 z-10">
            <h3 className="text-4xl font-bold text-slate-800 mb-1">
              {stat.value}
            </h3>
            <p className="text-sm font-semibold text-slate-500">{stat.title}</p>
            <p className="text-xs text-orange-500 font-semibold mt-2">
              {stat.description}
            </p>
          </div>
        </div>
      );
    }

    // Standard Card Style
    return (
      <div
        key={index}
        className={cn(
          "col-span-1 bg-white/80 backdrop-blur-xl rounded-3xl p-6 flex flex-col justify-between shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-white/60",
          stat.path ? "cursor-pointer" : "cursor-default",
        )}
        onClick={() => stat.path && navigate(stat.path)}
      >
        <div className="flex justify-between items-start mb-4">
          <p className="text-sm font-semibold text-slate-500">{stat.title}</p>
          <div
            className={`${stat.bgClass || "bg-blue-50"} p-2 rounded-xl ${stat.textClass || "text-primary"}`}
          >
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <div>
          <h3 className="text-3xl font-bold text-slate-800">{stat.value}</h3>
          <p className="text-xs text-primary font-semibold mt-1">
            {stat.description}
          </p>
        </div>
      </div>
    );
  };

  const DashboardSkeleton = () => (
    <div className="max-w-[1600px]">
      {/* Header Skeleton */}
      <div className="flex justify-end mb-6">
        <Skeleton className="h-11 w-48 rounded-xl" />
      </div>

      <div className={gridClass}>
        {/* Welcome Hero Skeleton */}
        <div className={`${welcomeColSpan} bg-white/50 rounded-3xl p-8 h-[200px] border border-white/60`}>
          <Skeleton className="h-8 w-1/3 mb-4 rounded-lg" />
          <Skeleton className="h-6 w-1/2 rounded-lg" />
        </div>

        {/* Stat Card Skeletons (Top 2) */}
        {[1, 2].map((i) => (
          <div key={i} className="col-span-1 bg-white/50 rounded-3xl p-6 h-[160px] border border-white/60">
            <div className="flex justify-between items-start mb-6">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-10 w-10 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-16 mb-2 rounded-lg" />
            <Skeleton className="h-3 w-32 rounded" />
          </div>
        ))}

        {/* Stat Card Skeletons (Remaining 4) */}
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="col-span-1 bg-white/50 rounded-3xl p-6 h-[160px] border border-white/60">
            <div className="flex justify-between items-start mb-6">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-10 w-10 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-16 mb-2 rounded-lg" />
            <Skeleton className="h-3 w-32 rounded" />
          </div>
        ))}

        {/* Large Cards Skeletons (4 cards) */}
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`${onLeaveTodayColSpan} bg-white/50 rounded-3xl p-6 h-[220px] border border-white/60`}>
            <div className="flex items-center gap-2 mb-6">
              <Skeleton className="h-6 w-6 rounded-lg" />
              <Skeleton className="h-6 w-40 rounded-lg" />
            </div>
            <div className="flex gap-4 items-center mb-4">
              <Skeleton className="h-16 w-16 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-1/2 rounded" />
                <Skeleton className="h-4 w-1/3 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="max-w-[1600px]">
      {/* Header with Year Filter */}
      <div className="flex justify-end mb-6">
        <div className="w-full md:w-48">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-full h-11 bg-white border border-slate-200 hover:border-primary/50 hover:shadow-md focus:ring-2 focus:ring-primary/20 transition-all duration-300 rounded-xl">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <SelectValue placeholder="Select Year" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-slate-100 shadow-xl p-1 bg-white">
              {years.map((year) => (
                <SelectItem
                  key={year}
                  value={year}
                  className="rounded-lg focus:bg-slate-50 focus:text-primary font-medium cursor-pointer my-1"
                >
                  Year {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className={gridClass}>
        {/* Welcome Hero Card - Spans 2 columns now (was 3) */}
        <div
          className={`${welcomeColSpan} bg-white/80 backdrop-blur-xl rounded-3xl p-8 relative overflow-hidden shadow-sm hover:shadow-lg transition-all duration-500 border border-white/60`}
        >
          <div className="absolute -right-20 -top-20 w-96 h-96 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex flex-col justify-center h-full gap-2">
            <div className="max-w-3xl">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-2 tracking-tight">
                Welcome back,{" "}
                {user?.first_name
                  ? user.first_name.charAt(0).toUpperCase() +
                  user.first_name.slice(1)
                  : "User"}
                !
              </h2>
              <p className="text-slate-500 text-lg font-medium">{subtitle}</p>
            </div>
          </div>
        </div>

        {/* Dynamic Stat Cards - Top 2 cards (Indices 0 & 1) */}
        {visibleStats
          .slice(0, 2)
          .map((stat, index) => renderStatCard(stat, index))}

        {/* Remaining Stat Cards (Indices 2 onwards) */}
        {visibleStats
          .slice(2)
          .map((stat, index) => renderStatCard(stat, index + 2))}

        {/* Upcoming Holiday Card - Spans 2 columns */}
        {upcomingHolidaysList.length > 0 && (
          <div
            className={`${upcomingHolidayColSpan} bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/60 flex flex-col`}
          >
            <div className='flex items-center gap-2 mb-4'>
              <Palmtree className='w-5 h-5 text-primary' />
              <h3 className='font-bold text-slate-800 text-lg'>
                Upcoming Holiday
              </h3>
            </div>
            <div className='flex items-center gap-5 bg-white/60 p-4 rounded-2xl border border-slate-100 flex-1'>
              <div className='flex flex-col items-center justify-center bg-white shadow-sm rounded-xl w-16 h-16 shrink-0 border border-slate-100'>
                <span className='text-[10px] font-bold text-primary uppercase tracking-wide'>
                  {new Date(upcomingHolidaysList[0].date).toLocaleDateString(
                    'en-US',
                    { month: 'short' },
                  )}
                </span>
                <span className='text-2xl font-bold text-slate-800'>
                  {new Date(upcomingHolidaysList[0].date).getDate()}
                </span>
              </div>
              <div className='flex flex-col min-w-0'>
                <h4 className='text-lg font-bold text-slate-800 truncate'>
                  {upcomingHolidaysList[0].name}
                </h4>
                <p className='text-slate-500 text-sm mt-0.5'>
                  {formatDate(upcomingHolidaysList[0].date)} •{' '}
                  {upcomingHolidaysList[0].type || 'National Holiday'}
                </p>
                <span className='text-xs text-slate-400 mt-2 font-medium bg-slate-100 px-2 py-1 rounded-md w-fit'>
                  Next {upcomingHolidaysList.length} holiday
                  {upcomingHolidaysList.length !== 1 ? 's' : ''} on calendar
                </span>
              </div>
            </div>
          </div>
        )}

        {/* On Leave Today Card - Spans 2 columns */}
        {employeesOnLeaveToday.length > 0 && (
          <div
            className={`${onLeaveTodayColSpan} bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/60 flex flex-col`}
          >
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center gap-2'>
                <UserCheck className='w-5 h-5 text-primary' />
                <h3 className='font-bold text-slate-800 text-lg'>
                  On Leave Today
                </h3>
              </div>
              <span className='text-xs font-bold bg-blue-50 text-primary px-3 py-1 rounded-full'>
                {employeesOnLeaveToday.length} Away
              </span>
            </div>
            <div className='flex flex-col gap-3 flex-1 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar'>
              {employeesOnLeaveToday.map((emp) => (
                <div
                  key={emp.id}
                  className='flex items-center gap-4 p-3 rounded-2xl bg-white/60 border border-slate-100 hover:bg-white transition-colors cursor-pointer'
                >
                  {emp.user_image ? (
                    <div
                      className='w-11 h-11 rounded-full ring-2 ring-white bg-cover bg-center shadow-sm shrink-0'
                      style={{ backgroundImage: `url("${emp.user_image}")` }}
                    ></div>
                  ) : (
                    <div className='w-11 h-11 rounded-full ring-2 ring-white bg-primary/10 flex items-center justify-center text-primary font-bold text-base shadow-sm shrink-0'>
                      {emp.first_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className='flex flex-col flex-1 min-w-0'>
                    <h4 className='text-sm font-bold text-slate-800 truncate'>
                      {emp.first_name.charAt(0).toUpperCase() +
                        emp.first_name.slice(1)}{' '}
                      {emp.last_name.charAt(0).toUpperCase() +
                        emp.last_name.slice(1)}
                    </h4>
                    <p className='text-xs text-slate-500 truncate'>
                      {emp.designation || 'Employee'}
                    </p>
                  </div>
                  <span className='px-3 py-1.5 bg-blue-50 text-primary text-xs font-semibold rounded-lg border border-blue-100 capitalize whitespace-nowrap'>
                    {emp.leave_type} • {emp.duration}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Today's Birthday Card - Festive Theme */}
        {todaysBirthdays.length > 0 && (
          <div
            className={`${onLeaveTodayColSpan} bg-gradient-to-br from-rose-50 to-pink-100 backdrop-blur-xl rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-pink-100 flex flex-col relative overflow-hidden`}
          >
            {/* Decorative Background Element */}
            <PartyPopper className='absolute -right-6 -top-6 w-32 h-32 text-pink-200/50 rotate-12' />

            <div className='flex items-center justify-between mb-4 relative z-10'>
              <div className='flex items-center gap-2'>
                <div className='p-2 bg-white/80 rounded-xl shadow-sm text-rose-500'>
                  <Cake className='w-5 h-5' />
                </div>
                <h3 className='font-bold text-slate-800 text-lg'>
                  Today's Birthdays
                </h3>
              </div>
              <span className='text-xs font-bold bg-white/60 text-rose-600 px-3 py-1 rounded-full border border-white/50 shadow-sm'>
                {todaysBirthdays.length} Birthday
                {todaysBirthdays.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className='flex flex-col gap-3 flex-1 relative z-10 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar'>
              {todaysBirthdays.map((user) => (
                <div
                  key={user.id}
                  className='flex items-center gap-4 p-3 rounded-2xl bg-white/60 border border-white/50 hover:bg-white transition-colors cursor-pointer shadow-sm group'
                >
                  {user.user_image ? (
                    <div
                      className='w-11 h-11 rounded-full ring-2 ring-white bg-cover bg-center shadow-sm shrink-0'
                      style={{ backgroundImage: `url("${user.user_image}")` }}
                    ></div>
                  ) : (
                    <div className='w-11 h-11 rounded-full ring-2 ring-white bg-rose-100 flex items-center justify-center text-rose-500 font-bold text-base shadow-sm shrink-0'>
                      {user.first_name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className='flex flex-col flex-1 min-w-0'>
                    <h4 className='text-sm font-bold text-slate-800 truncate group-hover:text-rose-600 transition-colors'>
                      {user.first_name} {user.last_name}
                    </h4>
                    <p className='text-xs text-slate-500 truncate capitalize'>
                      {user.designation || user.role || 'User'}
                    </p>
                  </div>
                  <Gift className='w-5 h-5 text-rose-400 animate-bounce' />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Upcoming Leave Card - Spans 2 columns */}
        {employeesOnLeaveWeek.length > 0 && (
          <div
            className={`${onLeaveTodayColSpan} bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/60 flex flex-col`}
          >
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center gap-2'>
                <CalendarDays className='w-5 h-5 text-primary' />
                <h3 className='font-bold text-slate-800 text-lg'>
                  Upcoming Leave
                </h3>
              </div>
              <span className='text-xs font-bold bg-orange-50 text-orange-600 px-3 py-1 rounded-full'>
                {employeesOnLeaveWeek.length} Found
              </span>
            </div>

            <div className='flex flex-col gap-3 flex-1 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar'>
              {employeesOnLeaveWeek.map((leave, index) => (
                <div
                  key={leave.id || index}
                  className='flex items-center gap-4 p-3 rounded-2xl bg-white/60 border border-slate-100 hover:bg-white transition-colors cursor-pointer group'
                >
                  {leave.user_image ? (
                    <div
                      className='w-11 h-11 rounded-full ring-2 ring-white bg-cover bg-center shadow-sm shrink-0'
                      style={{ backgroundImage: `url("${leave.user_image}")` }}
                    ></div>
                  ) : (
                    <div className='w-11 h-11 rounded-full ring-2 ring-white bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-base shadow-sm shrink-0'>
                      {leave.first_name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className='flex flex-col flex-1 min-w-0'>
                    <h4 className='text-sm font-bold text-slate-800 truncate group-hover:text-primary transition-colors'>
                      {leave.first_name} {leave.last_name}
                    </h4>
                    <div className='flex items-center gap-2 text-xs text-slate-500 mt-0.5'>
                      <span className='font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider'>
                        {formatDate(leave.start_date)}
                      </span>
                      {leave.start_date !== leave.end_date && (
                        <>
                          <span>-</span>
                          <span className='font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider'>
                            {formatDate(leave.end_date)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className='flex flex-col items-end gap-1'>
                    <span className='px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md uppercase tracking-wide border border-blue-100'>
                      {leave.leave_type}
                    </span>
                    <span className='text-[10px] font-medium text-slate-400 capitalize'>
                      {leave.duration?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Birthday Celebration Modal */}
      <BirthdayCelebration
        isOpen={showBirthdayCelebration}
        onClose={() => setShowBirthdayCelebration(false)}
      />
    </div>
  );
};

export default Dashboard;
