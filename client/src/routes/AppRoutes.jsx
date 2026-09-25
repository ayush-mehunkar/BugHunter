import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import AcceptInvitation from "../pages/AcceptInvitation";
import Dashboard from "../pages/Dashboard";
import Bugs from "../pages/Bugs";
import CreateBug from "../pages/CreateBug";
import BugDetails from "../pages/BugDetails";
import Projects from "../pages/Projects";
import Users from "../pages/Users";
import Invitations from "../pages/Invitations";
import TestCases from "../pages/TestCases";
import CreateTestCase from "../pages/CreateTestCase";
import TestCaseDetails from "../pages/TestCaseDetails";

import Layout from "../components/layout/Layout";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />
        <Route
          path="/reset-password/:token"
          element={<ResetPassword />}
        />

        {/* Public invitation acceptance */}
        <Route
          path="/accept-invitation/:token"
          element={<AcceptInvitation />}
        />

        {/* Authenticated application */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />

            <Route path="/bugs" element={<Bugs />} />
            <Route path="/bugs/create" element={<CreateBug />} />
            <Route path="/bugs/:id" element={<BugDetails />} />

            <Route path="/test-cases" element={<TestCases />} />

            <Route
              path="/test-cases/create"
              element={<CreateTestCase />}
            />

            <Route
              path="/test-cases/:id"
              element={<TestCaseDetails />}
            />

            <Route path="/projects" element={<Projects />} />

            {/* Admin and Manager only */}
            <Route
              element={
                <RoleRoute allowedRoles={["admin", "manager"]} />
              }
            >
              <Route path="/users" element={<Users />} />
              <Route
                path="/invitations"
                element={<Invitations />}
              />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
