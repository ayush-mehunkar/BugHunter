import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  deleteTestCase,
  getTestCases,
} from "../services/testCaseService";

const priorityOptions = [
  "Low",
  "Medium",
  "High",
  "Critical",
];

const statusOptions = [
  "Draft",
  "Ready",
  "Deprecated",
];

function TestCases() {
  const [testCases, setTestCases] = useState([]);
  const [search, setSearch] = useState("");
  const [project, setProject] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const loadTestCases = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getTestCases({
        search: search.trim(),
        project: project.trim(),
        priority,
        status,
      });

      setTestCases(result.testCases || []);
    } catch (err) {
      console.error("Load test cases error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load test cases."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTestCases();
  }, []);

  const projectOptions = useMemo(() => {
    const projects = testCases
      .map((testCase) => testCase.project)
      .filter(Boolean);

    return [...new Set(projects)].sort();
  }, [testCases]);

  const handleSearch = async (event) => {
    event.preventDefault();
    setMessage("");
    await loadTestCases();
  };

  const handleClearFilters = async () => {
    setSearch("");
    setProject("");
    setPriority("");
    setStatus("");
    setMessage("");

    try {
      setLoading(true);
      setError("");

      const result = await getTestCases();

      setTestCases(result.testCases || []);
    } catch (err) {
      console.error(
        "Clear test case filters error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load test cases."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (testCase) => {
    const confirmed = window.confirm(
      `Delete "${testCase.title}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(testCase._id);
      setError("");
      setMessage("");

      await deleteTestCase(testCase._id);

      setTestCases((previous) =>
        previous.filter(
          (item) => item._id !== testCase._id
        )
      );

      setMessage("Test case deleted successfully.");
    } catch (err) {
      console.error(
        "Delete test case error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete test case."
      );
    } finally {
      setDeletingId("");
    }
  };

  const getPriorityClass = (value) => {
    return `test-case-badge test-case-priority-${value
      ?.toLowerCase()
      .replace(/\s+/g, "-")}`;
  };

  const getStatusClass = (value) => {
    return `test-case-badge test-case-status-${value
      ?.toLowerCase()
      .replace(/\s+/g, "-")}`;
  };

  return (
    <div className="test-cases-page">
      <div className="test-cases-header">
        <div>
          <div className="test-cases-breadcrumb">
            <span>QA Management</span>
            <span>/</span>
            <span>Test Cases</span>
          </div>

          <h1>Test Cases</h1>

          <p>
            Create, manage and execute structured QA
            scenarios for your projects.
          </p>
        </div>

        <Link
          to="/test-cases/create"
          className="test-cases-primary-button"
        >
          + Create Test Case
        </Link>
      </div>

      <div className="test-cases-toolbar">
        <form
          className="test-cases-search"
          onSubmit={handleSearch}
        >
          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search test cases..."
            aria-label="Search test cases"
          />

          <button type="submit">
            Search
          </button>
        </form>

        <div className="test-cases-filters">
          <select
            value={project}
            onChange={(event) =>
              setProject(event.target.value)
            }
            aria-label="Filter by project"
          >
            <option value="">
              All Projects
            </option>

            {projectOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value)
            }
            aria-label="Filter by priority"
          >
            <option value="">
              All Priorities
            </option>

            {priorityOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            aria-label="Filter by status"
          >
            <option value="">
              All Statuses
            </option>

            {statusOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="test-cases-clear-button"
            onClick={handleClearFilters}
          >
            Clear
          </button>
        </div>
      </div>

      {message && (
        <div className="test-cases-success">
          ✓ {message}
        </div>
      )}

      {error && (
        <div className="test-cases-error">
          <strong>Unable to load test cases.</strong>
          <span>{error}</span>
        </div>
      )}

      <div className="test-cases-summary">
        <span>
          {loading
            ? "Loading..."
            : `${testCases.length} test case${
                testCases.length !== 1
                  ? "s"
                  : ""
              }`}
        </span>
      </div>

      <div className="test-cases-card">
        {loading ? (
          <div className="test-cases-state">
            <div className="test-cases-spinner" />
            <h3>Loading test cases</h3>
            <p>
              Please wait while we fetch your QA
              scenarios.
            </p>
          </div>
        ) : testCases.length === 0 ? (
          <div className="test-cases-state">
            <div className="test-cases-empty-icon">
              ✓
            </div>

            <h3>No test cases yet</h3>

            <p>
              Create your first test case to start
              building a structured QA workflow.
            </p>

            <Link
              to="/test-cases/create"
              className="test-cases-primary-button"
            >
              Create Test Case
            </Link>
          </div>
        ) : (
          <div className="test-cases-table-wrapper">
            <table className="test-cases-table">
              <thead>
                <tr>
                  <th>Test Case</th>
                  <th>Project</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {testCases.map((testCase) => (
                  <tr key={testCase._id}>
                    <td>
                      <div className="test-case-title">
                        {testCase.title}
                      </div>

                      {testCase.description && (
                        <div className="test-case-description">
                          {testCase.description}
                        </div>
                      )}
                    </td>

                    <td>
                      <span className="test-case-project">
                        {testCase.project}
                      </span>
                    </td>

                    <td>
                      <span
                        className={getPriorityClass(
                          testCase.priority
                        )}
                      >
                        {testCase.priority}
                      </span>
                    </td>

                    <td>
                      <span
                        className={getStatusClass(
                          testCase.status
                        )}
                      >
                        {testCase.status}
                      </span>
                    </td>

                    <td>
                      {testCase.createdBy?.name ||
                        testCase.createdBy?.email ||
                        "Unknown"}
                    </td>

                    <td>
                      {testCase.createdAt
                        ? new Date(
                            testCase.createdAt
                          ).toLocaleDateString()
                        : "—"}
                    </td>

                    <td>
                      <div className="test-case-actions">
                        <Link
                          to={`/test-cases/${testCase._id}`}
                          className="test-case-action-link"
                        >
                          View
                        </Link>

                        <Link
                          to={`/test-cases/${testCase._id}/edit`}
                          className="test-case-action-link"
                        >
                          Edit
                        </Link>

                        <button
                          type="button"
                          className="test-case-delete-button"
                          onClick={() =>
                            handleDelete(testCase)
                          }
                          disabled={
                            deletingId ===
                            testCase._id
                          }
                        >
                          {deletingId ===
                          testCase._id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default TestCases;
