import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import StudentRegister from "../pages/StudentRegister";
import NotFound from "../pages/NotFound";
import ProtectedRoute from "../components/ProtectedRoute";

// Admin Modules
import AdminDashboard from "../modules/admin/pages/AdminDashboard";
import ManageDepartments from "../modules/admin/pages/ManageDepartments";
import ManageSemesters from "../modules/admin/pages/ManageSemesters";
import ManageClasses from "../modules/admin/pages/ManageClasses";
import ManageFaculty from "../modules/admin/pages/ManageFaculty";
import ManageStudent from "../modules/admin/pages/ManageStudents";
import ManageSubject from "../modules/admin/pages/ManageSubjects";
import ManageTimeSlot from "../modules/admin/pages/ManageTimeSlots";
import ManageRoom from "../modules/admin/pages/ManageRooms";
import AdminFacultyAvailability from "../modules/admin/pages/AdminFacultyAvailability";
import GenerateTimetable from "../modules/admin/pages/GenerateTimetable";
import AdminTimetable from "../modules/admin/pages/AdminTimetable";

// Faculty Modules
import FacultyDashboard from "../modules/faculty/pages/FacultyDashboard";
import MySubjects from "../modules/faculty/pages/MySubjects";
import MyTimetable from "../modules/faculty/pages/MyTimetable";
import Availability from "../modules/faculty/pages/Availability";
import FacultyProfile from "../modules/faculty/pages/FacultyProfile";

// Student Modules
import StudentDashboard from "../modules/student/pages/StudentDashboard";
import MyProfile from "../modules/student/pages/MyProfile";
import MySubjects_stud from "../modules/student/pages/MySubjects_stud";
import MyTimetable_stud from "../modules/student/pages/MyTimetable_stud";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/student/register" element={<StudentRegister />} />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/departments"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ManageDepartments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/semesters"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ManageSemesters />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/classes"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ManageClasses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/faculty"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ManageFaculty />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ManageStudent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/subjects"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ManageSubject />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/timeslots"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ManageTimeSlot />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/rooms"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ManageRoom />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/faculty-availability"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminFacultyAvailability />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/timetable"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <GenerateTimetable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/view-timetable"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminTimetable />
            </ProtectedRoute>
          }
        />

        {/* Faculty Routes */}
        <Route
          path="/faculty/dashboard"
          element={
            <ProtectedRoute allowedRoles={["faculty"]}>
              <FacultyDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/subjects"
          element={
            <ProtectedRoute allowedRoles={["faculty"]}>
              <MySubjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/timetable"
          element={
            <ProtectedRoute allowedRoles={["faculty"]}>
              <MyTimetable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/availability"
          element={
            <ProtectedRoute allowedRoles={["faculty"]}>
              <Availability />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/profile"
          element={
            <ProtectedRoute allowedRoles={["faculty"]}>
              <FacultyProfile />
            </ProtectedRoute>
          }
        />

        {/* Student Routes */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/profile"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <MyProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/subjects"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <MySubjects_stud />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/timetable"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <MyTimetable_stud />
            </ProtectedRoute>
          }
        />

        {/* 404 Page Not Found Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
