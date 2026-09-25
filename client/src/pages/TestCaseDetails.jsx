import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  deleteTestCase,
  getTestCaseById,
} from "../services/testCaseService";

import {
  createTestExecution,
  getTestExecutions,
} from "../services/testExecutionService";

import { getBugs } from "../services/bugService";

function TestCaseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [testCase, setTestCase] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [bugs, setBugs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [executionsLoading, setExecutionsLoading] =
    useState(false);
  const [bugsLoading, setBugsLoading] = useState(false);

  const [error, setError] = useState("");
  const [executionError, setExecutionError] =
    useState("");

  const [deleting, setDeleting] = useState(false);
  const [executing, setExecuting] = useState(false);

  const [executionForm, setExecutionForm] = useState({
    result: "",
    defectBug: "",
    environment: "",
    actualResult: "",
    notes: "",
  });

  const loadTestCase = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getTestCaseById(id);

      setTestCase(result.testCase || result);
    } catch (err) {
      console.error(
        "Load test case details error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load test case."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadExecutions = async () => {
    try {
      setExecutionsLoading(true);
      setExecutionError("");

      const result = await getTestExecutions(id);

      setExecutions(result.executions || []);
    } catch (err) {
      console.error(
        "Load test executions error:",
        err
      );

      setExecutionError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load execution history."
      );
    } finally {
      setExecutionsLoading(false);
    }
  };

  const loadBugs = async () => {
    try {
      setBugsLoading(true);

      const result = await getBugs();

      setBugs(result.bugs || []);
    } catch (err) {
      console.error(
        "Load bugs for test execution error:",
        err
      );

      setExecutionError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load bugs for defect linking."
      );
    } finally {
      setBugsLoading(false);
    }
  };

  useEffect(() => {
    loadTestCase();
    loadExecutions();
    loadBugs();
  }, [id]);

  const handleDelete = async () => {
    if (!testCase) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${testCase.title}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await deleteTestCase(testCase._id);

      navigate("/test-cases");
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
      setDeleting(false);
    }
  };

  const handleExecutionFormChange = (event) => {
    const { name, value } = event.target;

    setExecutionForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleResultSelect = (result) => {
    setExecutionForm((current) => ({
      ...current,
      result,
      defectBug:
        result === "Fail"
          ? current.defectBug
          : "",
    }));
  };

  const handleExecute = async (event) => {
    event.preventDefault();

    if (!executionForm.result) {
      setExecutionError(
        "Please select Pass, Fail or Blocked."
      );
      return;
    }

    if (
      executionForm.result === "Fail" &&
      !executionForm.defectBug
    ) {
      setExecutionError(
        "Please select a defect bug for a failed execution."
      );
      return;
    }

    try {
      setExecuting(true);
      setExecutionError("");

      await createTestExecution({
        testCase: id,
        result: executionForm.result,
        defectBug:
          executionForm.result === "Fail"
            ? executionForm.defectBug
            : null,
        environment: executionForm.environment,
        actualResult: executionForm.actualResult,
        notes: executionForm.notes,
      });

      setExecutionForm({
        result: "",
        defectBug: "",
        environment: "",
        actualResult: "",
        notes: "",
      });

      await loadExecutions();
    } catch (err) {
      console.error(
        "Create test execution error:",
        err
      );

      setExecutionError(
        err.response?.data?.message ||
          err.message ||
          "Failed to record test execution."
      );
    } finally {
      setExecuting(false);
    }
  };

  const getPriorityClass = (value) => {
    return `test-case-details-badge test-case-details-priority-${value
      ?.toLowerCase()
      .replace(/\s+/g, "-")}`;
  };

  const getStatusClass = (value) => {
    return `test-case-details-badge test-case-details-status-${value
      ?.toLowerCase()
      .replace(/\s+/g, "-")}`;
  };

  const getExecutionResultClass = (value) => {
    return `test-case-details-history-result test-case-details-history-result-${value
      ?.toLowerCase()
      .replace(/\s+/g, "-")}`;
  };

  const formatDateTime = (value) => {
    if (!value) {
      return "—";
    }

    return new Date(value).toLocaleString();
  };

  if (loading) {
    return (
      <div className="test-case-details-state">
        <div className="test-case-details-spinner" />

        <h2>Loading test case</h2>

        <p>
          Please wait while we load the test case
          details.
        </p>
      </div>
    );
  }

  if (error && !testCase) {
    return (
      <div className="test-case-details-state">
        <div className="test-case-details-error-icon">
          !
        </div>

        <h2>Unable to load test case</h2>

        <p>{error}</p>

        <Link
          to="/test-cases"
          className="test-case-details-primary-button"
        >
          ← Back to Test Cases
        </Link>
      </div>
    );
  }

  if (!testCase) {
    return (
      <div className="test-case-details-state">
        <h2>Test case not found</h2>

        <p>
          The requested test case could not be found.
        </p>

        <Link
          to="/test-cases"
          className="test-case-details-primary-button"
        >
          ← Back to Test Cases
        </Link>
      </div>
    );
  }

  return (
    <div className="test-case-details-page">
      <div className="test-case-details-header">
        <div>
          <div className="test-case-details-breadcrumb">
            <Link to="/test-cases">
              QA Management
            </Link>

            <span>/</span>

            <Link to="/test-cases">
              Test Cases
            </Link>

            <span>/</span>

            <span>Details</span>
          </div>

          <h1>{testCase.title}</h1>

          <p>
            Review the test scenario and its expected
            behaviour.
          </p>
        </div>

        <div className="test-case-details-header-actions">
          <Link
            to="/test-cases"
            className="test-case-details-secondary-button"
          >
            ← Back
          </Link>

          <Link
            to={`/test-cases/${testCase._id}/edit`}
            className="test-case-details-secondary-button"
          >
            Edit
          </Link>

          <button
            type="button"
            className="test-case-details-delete-button"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {error && (
        <div className="test-case-details-error">
          <strong>Error</strong>

          <span>{error}</span>
        </div>
      )}

      <div className="test-case-details-layout">
        <main className="test-case-details-main">
          <section className="test-case-details-card">
            <div className="test-case-details-card-header">
              <div>
                <span className="test-case-details-eyebrow">
                  Test Case
                </span>

                <h2>Scenario Overview</h2>
              </div>

              <div className="test-case-details-badges">
                <span
                  className={getPriorityClass(
                    testCase.priority
                  )}
                >
                  {testCase.priority}
                </span>

                <span
                  className={getStatusClass(
                    testCase.status
                  )}
                >
                  {testCase.status}
                </span>
              </div>
            </div>

            {testCase.description && (
              <div className="test-case-details-section">
                <h3>Description</h3>

                <p className="test-case-details-text">
                  {testCase.description}
                </p>
              </div>
            )}

            <div className="test-case-details-section">
              <h3>Preconditions</h3>

              <div className="test-case-details-content">
                {testCase.preconditions ? (
                  <pre>
                    {testCase.preconditions}
                  </pre>
                ) : (
                  <p className="test-case-details-muted">
                    No preconditions specified.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="test-case-details-card">
            <div className="test-case-details-card-header">
              <div>
                <span className="test-case-details-eyebrow">
                  Execution
                </span>

                <h2>Test Procedure</h2>
              </div>
            </div>

            <div className="test-case-details-section">
              <h3>Test Steps</h3>

              <div className="test-case-details-content">
                <pre>{testCase.steps}</pre>
              </div>
            </div>

            <div className="test-case-details-section">
              <h3>Expected Result</h3>

              <div className="test-case-details-expected">
                <span className="test-case-details-check">
                  ✓
                </span>

                <p>{testCase.expectedResult}</p>
              </div>
            </div>
          </section>

          <section className="test-case-details-card">
            <div className="test-case-details-card-header">
              <div>
                <span className="test-case-details-eyebrow">
                  QA Execution
                </span>

                <h2>Execute Test Case</h2>
              </div>
            </div>

            <form
              className="test-case-details-execution-form"
              onSubmit={handleExecute}
            >
              <div>
                <div className="test-case-details-execution-result-label">
                  Execution Result
                </div>

                <div className="test-case-details-result-buttons">
                  <button
                    type="button"
                    className={`test-case-details-result-button pass ${
                      executionForm.result === "Pass"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      handleResultSelect("Pass")
                    }
                  >
                    ✓ Pass
                  </button>

                  <button
                    type="button"
                    className={`test-case-details-result-button fail ${
                      executionForm.result === "Fail"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      handleResultSelect("Fail")
                    }
                  >
                    ✕ Fail
                  </button>

                  <button
                    type="button"
                    className={`test-case-details-result-button blocked ${
                      executionForm.result ===
                      "Blocked"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      handleResultSelect("Blocked")
                    }
                  >
                    ⏸ Blocked
                  </button>
                </div>
              </div>

              {executionForm.result === "Fail" && (
                <div className="test-case-details-form-group">
                  <label htmlFor="defectBug">
                    Defect Bug
                  </label>

                  <select
                    id="defectBug"
                    name="defectBug"
                    value={executionForm.defectBug}
                    onChange={
                      handleExecutionFormChange
                    }
                    disabled={bugsLoading}
                  >
                    <option value="">
                      {bugsLoading
                        ? "Loading bugs..."
                        : "Select a defect bug..."}
                    </option>

                    {bugs.map((bug) => (
                      <option
                        key={bug._id}
                        value={bug._id}
                      >
                        {bug.title} — {bug.status} —{" "}
                        {bug.priority}
                      </option>
                    ))}
                  </select>

                  {!bugsLoading &&
                    bugs.length === 0 && (
                      <p className="test-case-details-muted">
                        No bugs are available to link.
                      </p>
                    )}
                </div>
              )}

              <div className="test-case-details-form-group">
                <label htmlFor="environment">
                  Environment
                </label>

                <input
                  id="environment"
                  name="environment"
                  type="text"
                  value={executionForm.environment}
                  onChange={
                    handleExecutionFormChange
                  }
                  placeholder="e.g. Staging, Production, Chrome"
                />
              </div>

              <div className="test-case-details-form-group">
                <label htmlFor="actualResult">
                  Actual Result
                </label>

                <textarea
                  id="actualResult"
                  name="actualResult"
                  value={executionForm.actualResult}
                  onChange={
                    handleExecutionFormChange
                  }
                  placeholder="Describe what actually happened during execution..."
                />
              </div>

              <div className="test-case-details-form-group">
                <label htmlFor="notes">
                  Execution Notes
                </label>

                <textarea
                  id="notes"
                  name="notes"
                  value={executionForm.notes}
                  onChange={
                    handleExecutionFormChange
                  }
                  placeholder="Add observations, test data, or other notes..."
                />
              </div>

              {executionError && (
                <div className="test-case-details-execution-error">
                  <strong>Error</strong>

                  <span>{executionError}</span>
                </div>
              )}

              <div className="test-case-details-execution-actions">
                <button
                  type="submit"
                  className="test-case-details-execute-button"
                  disabled={executing}
                >
                  {executing
                    ? "Recording..."
                    : "Record Execution"}
                </button>
              </div>
            </form>
          </section>

          <section className="test-case-details-card">
            <div className="test-case-details-card-header">
              <div>
                <span className="test-case-details-eyebrow">
                  History
                </span>

                <h2>Execution History</h2>
              </div>

              <span className="test-case-details-count-badge">
                {executions.length}
              </span>
            </div>

            {executionError &&
              executions.length === 0 && (
                <div className="test-case-details-execution-error">
                  <strong>Error</strong>

                  <span>{executionError}</span>
                </div>
              )}

            {executionsLoading ? (
              <div className="test-case-details-execution-loading">
                Loading execution history...
              </div>
            ) : executions.length === 0 ? (
              <div className="test-case-details-history-empty">
                No executions recorded yet.
              </div>
            ) : (
              <div className="test-case-details-execution-history">
                {executions.map((execution) => (
                  <div
                    key={execution._id}
                    className="test-case-details-history-item"
                  >
                    <div className="test-case-details-history-main">
                      <span
                        className={getExecutionResultClass(
                          execution.result
                        )}
                      >
                        {execution.result}
                      </span>

                      <p>
                        Executed by{" "}
                        <strong>
                          {execution.executedBy?.name ||
                            execution.executedBy?.email ||
                            "Unknown"}
                        </strong>
                      </p>

                      {execution.environment && (
                        <p>
                          Environment:{" "}
                          <strong>
                            {execution.environment}
                          </strong>
                        </p>
                      )}

                      {execution.actualResult && (
                        <p className="test-case-details-history-notes">
                          Actual result:{" "}
                          {execution.actualResult}
                        </p>
                      )}

                      {execution.notes && (
                        <p className="test-case-details-history-notes">
                          Notes: {execution.notes}
                        </p>
                      )}

                      {execution.defectBug && (
                        <p className="test-case-details-history-notes">
                          Linked defect:{" "}
                          <strong>
                            {execution.defectBug.title}
                          </strong>
                        </p>
                      )}
                    </div>

                    <div className="test-case-details-history-meta">
                      {formatDateTime(
                        execution.createdAt
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>

        <aside className="test-case-details-sidebar">
          <section className="test-case-details-card">
            <div className="test-case-details-card-header">
              <div>
                <span className="test-case-details-eyebrow">
                  Information
                </span>

                <h2>Test Case Details</h2>
              </div>
            </div>

            <div className="test-case-details-info-list">
              <div className="test-case-details-info-item">
                <span>Project</span>

                <strong>
                  {testCase.project}
                </strong>
              </div>

              <div className="test-case-details-info-item">
                <span>Priority</span>

                <strong>
                  {testCase.priority}
                </strong>
              </div>

              <div className="test-case-details-info-item">
                <span>Status</span>

                <strong>
                  {testCase.status}
                </strong>
              </div>

              <div className="test-case-details-info-item">
                <span>Created By</span>

                <strong>
                  {testCase.createdBy?.name ||
                    testCase.createdBy?.email ||
                    "Unknown"}
                </strong>
              </div>

              <div className="test-case-details-info-item">
                <span>Created</span>

                <strong>
                  {testCase.createdAt
                    ? new Date(
                        testCase.createdAt
                      ).toLocaleDateString()
                    : "—"}
                </strong>
              </div>

              <div className="test-case-details-info-item">
                <span>Updated</span>

                <strong>
                  {testCase.updatedAt
                    ? new Date(
                        testCase.updatedAt
                      ).toLocaleDateString()
                    : "—"}
                </strong>
              </div>
            </div>
          </section>

          <section className="test-case-details-card">
            <div className="test-case-details-card-header">
              <div>
                <span className="test-case-details-eyebrow">
                  Classification
                </span>

                <h2>Tags</h2>
              </div>
            </div>

            {testCase.tags?.length > 0 ? (
              <div className="test-case-details-tags">
                {testCase.tags.map((tag) => (
                  <span
                    key={tag}
                    className="test-case-details-tag"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="test-case-details-muted">
                No tags assigned.
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

export default TestCaseDetails;
