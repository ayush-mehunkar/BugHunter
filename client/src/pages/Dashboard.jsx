import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  getDashboardSummary,
  getBugStatusStats,
  getBugPriorityStats,
  getProjectHealth,
} from "../services/dashboardService";

import { getCurrentUser } from "../utils/authUtils";

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [statusStats, setStatusStats] = useState([]);
  const [priorityStats, setPriorityStats] = useState([]);
  const [projectHealth, setProjectHealth] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = getCurrentUser();

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          summaryResponse,
          statusResponse,
          priorityResponse,
          projectHealthResponse,
        ] = await Promise.all([
          getDashboardSummary(),
          getBugStatusStats(),
          getBugPriorityStats(),
          getProjectHealth(),
        ]);

        setSummary(summaryResponse.summary || null);
        setStatusStats(statusResponse.stats || []);
        setPriorityStats(priorityResponse.stats || []);
        setProjectHealth(projectHealthResponse.projects || []);
      } catch (err) {
        console.error("Dashboard loading error:", err);

        setError(
          err.response?.data?.message ||
            "Failed to load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const statCards = [
    {
      label: "Total Bugs",
      value: summary?.totalBugs ?? 0,
      icon: "🐞",
      className: "dashboard-stat-primary",
    },
    {
      label: "Open Bugs",
      value: summary?.openBugs ?? 0,
      icon: "○",
      className: "dashboard-stat-warning",
    },
    {
      label: "In Progress",
      value: summary?.inProgressBugs ?? 0,
      icon: "◐",
      className: "dashboard-stat-info",
    },
    {
      label: "Resolved",
      value: summary?.resolvedBugs ?? 0,
      icon: "✓",
      className: "dashboard-stat-success",
    },
    {
      label: "Closed",
      value: summary?.closedBugs ?? 0,
      icon: "●",
      className: "dashboard-stat-neutral",
    },
    {
      label: "Reopened",
      value: summary?.reopenedBugs ?? 0,
      icon: "↻",
      className: "dashboard-stat-danger",
    },
    {
      label: "Projects",
      value: summary?.totalProjects ?? 0,
      icon: "▣",
      className: "dashboard-stat-purple",
    },
  ];

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-header">
          <div>
            <div className="dashboard-eyebrow">Workspace</div>

            <h1>Dashboard</h1>

            <p>
              Loading your QA workspace...
            </p>
          </div>
        </div>

        <div className="dashboard-loading">
          <div className="loading-spinner" />

          <span>
            Loading dashboard data...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-header">
          <div>
            <div className="dashboard-eyebrow">
              Workspace
            </div>

            <h1>Dashboard</h1>

            <p>
              Monitor bugs, projects and QA activity.
            </p>
          </div>
        </div>

        <div className="dashboard-error">
          <div className="dashboard-error-icon">
            !
          </div>

          <div>
            <h3>
              Unable to load dashboard
            </h3>

            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Dashboard Header */}

      <section className="dashboard-header">
        <div>
          <div className="dashboard-eyebrow">
            Workspace overview
          </div>

          <h1>
            Welcome back, {user?.name || "User"} 👋
          </h1>

          <p>
            Here's what's happening across your projects
            and QA workflow.
          </p>
        </div>

        <div className="dashboard-header-actions">
          <span className="dashboard-role-badge">
            {user?.role || "User"}
          </span>

          <a
            href="/bugs/create"
            className="dashboard-primary-action"
          >
            <span>+</span>
            Report Bug
          </a>

          <a
            href="/bugs"
            className="dashboard-secondary-action"
          >
            View Bugs
          </a>
        </div>
      </section>

      {/* KPI Cards */}

      <section className="dashboard-stats-grid">
        {statCards.map((card) => (
          <div
            className={`dashboard-stat-card ${card.className}`}
            key={card.label}
          >
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon">
                {card.icon}
              </div>
            </div>

            <div className="dashboard-stat-value">
              {card.value}
            </div>

            <div className="dashboard-stat-label">
              {card.label}
            </div>
          </div>
        ))}
      </section>

      {/* Charts */}

      <section className="dashboard-chart-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <h2>Bug Status</h2>

              <p>
                Current distribution of bugs by workflow status.
              </p>
            </div>
          </div>

          {statusStats.length === 0 ? (
            <div className="dashboard-empty">
              No bug status data available.
            </div>
          ) : (
            <div className="dashboard-chart">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={statusStats}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -20,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="_id"
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    cursor={{
                      opacity: 0.08,
                    }}
                    contentStyle={{
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      boxShadow:
                        "0 8px 24px rgba(15, 23, 42, 0.08)",
                    }}
                  />

                  <Bar
                    dataKey="count"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <h2>Bug Priority</h2>

              <p>
                Distribution of bugs by priority level.
              </p>
            </div>
          </div>

          {priorityStats.length === 0 ? (
            <div className="dashboard-empty">
              No bug priority data available.
            </div>
          ) : (
            <div className="dashboard-chart">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={priorityStats}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -20,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="_id"
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    cursor={{
                      opacity: 0.08,
                    }}
                    contentStyle={{
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      boxShadow:
                        "0 8px 24px rgba(15, 23, 42, 0.08)",
                    }}
                  />

                  <Bar
                    dataKey="count"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      {/* Project Health */}

      <section className="dashboard-card dashboard-project-card">
        <div className="dashboard-card-header">
          <div>
            <h2>Project Health</h2>

            <p>
              Track bug activity and critical issues across projects.
            </p>
          </div>

          <div className="dashboard-project-count">
            {projectHealth.length}{" "}
            {projectHealth.length === 1
              ? "Project"
              : "Projects"}
          </div>
        </div>

        {projectHealth.length === 0 ? (
          <div className="dashboard-empty">
            No project health data available.
          </div>
        ) : (
          <div className="project-health-list">
            {projectHealth.map((project) => (
              <div
                className="project-health-row"
                key={project._id}
              >
                <div className="project-health-main">
                  <div className="project-health-icon">
                    ▣
                  </div>

                  <div>
                    <h3>{project._id}</h3>

                    <p>
                      {project.totalBugs} total bugs
                    </p>
                  </div>
                </div>

                <div className="project-health-metrics">
                  <div>
                    <span>Total</span>
                    <strong>
                      {project.totalBugs}
                    </strong>
                  </div>

                  <div>
                    <span>Open</span>
                    <strong>
                      {project.openBugs}
                    </strong>
                  </div>

                  <div>
                    <span>In Progress</span>
                    <strong>
                      {project.inProgressBugs}
                    </strong>
                  </div>

                  <div>
                    <span>Resolved</span>
                    <strong>
                      {project.resolvedBugs}
                    </strong>
                  </div>

                  <div className="project-health-critical">
                    <span>Critical</span>
                    <strong>
                      {project.criticalBugs}
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
