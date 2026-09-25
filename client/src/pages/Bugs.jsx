import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getBugs, searchBugs } from "../services/bugService";

function Bugs() {
  const [bugs, setBugs] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [severity, setSeverity] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBugs = async () => {
    try {
      setLoading(true);
    setError("");

    const result = await getBugs({
        status,
        priority,
        severity,
      });

      console.log("Bugs loaded:", result);
      setBugs(result.bugs || []);
    } catch (error) {
      console.error("Get bugs error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load bugs. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    const searchTerm = search.trim();

    if (!searchTerm) {
      loadBugs();
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await searchBugs(searchTerm);

      console.log("Search results:", result);
      setBugs(result.bugs || []);
    } catch (error) {
      console.error("Search bugs error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to search bugs. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearch("");
    setStatus("");
    setPriority("");
    setSeverity("");

    setTimeout(() => {
      loadBugs();
    }, 0);
  };

  useEffect(() => {
    loadBugs();
  }, []);

  const getStatusClass = (value) => {
    const classes = {
      Open: "bug-status-open",
      "In Progress": "bug-status-progress",
      Resolved: "bug-status-resolved",
      Closed: "bug-status-closed",
      Reopened: "bug-status-reopened",
    };

    return classes[value] || "bug-status-default";
  };

  const getPriorityClass = (value) => {
    const classes = {
      Low: "bug-priority-low",
      Medium: "bug-priority-medium",
      High: "bug-priority-high",
      Critical: "bug-priority-critical",
    };

    return classes[value] || "bug-priority-default";
  };

  const getSeverityClass = (value) => {
    const classes = {
      Minor: "bug-severity-minor",
      Major: "bug-severity-major",
      Critical: "bug-severity-critical",
      Blocker: "bug-severity-blocker",
    };

    return classes[value] || "bug-severity-default";
  };

  return (
    <div className="bugs-page">
      {/* Header */}

      <section className="bugs-header">
        <div>
          <div className="bugs-eyebrow">
            QA workspace
          </div>

          <h1>Bug Management</h1>

          <p>
            Track, search and manage issues across your projects.
          </p>
        </div>

        <Link
          to="/bugs/create"
          className="bugs-create-button"
        >
          <span>+</span>
          Report Bug
        </Link>
      </section>

      {/* Search and Filters */}

      <section className="bugs-filter-card">
        <div className="bugs-search-row">
          <div className="bugs-search-wrapper">
            <span className="bugs-search-icon">
              ⌕
            </span>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="Search bugs by title, description or project..."
              className="bugs-search-input"
            />
          </div>

          <button
            type="button"
            onClick={handleSearch}
            className="bugs-search-button"
          >
            Search
          </button>
        </div>

        <div className="bugs-filter-divider" />

        <div className="bugs-filter-row">
          <div className="bugs-filter-group">
            <label htmlFor="bug-status">
              Status
            </label>

            <select
              id="bug-status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">
                In Progress
              </option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
              <option value="Reopened">Reopened</option>
            </select>
          </div>

          <div className="bugs-filter-group">
            <label htmlFor="bug-priority">
              Priority
            </label>

            <select
              id="bug-priority"
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value)
              }
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">
                Critical
              </option>
            </select>
          </div>

          <div className="bugs-filter-group">
            <label htmlFor="bug-severity">
              Severity
            </label>

            <select
              id="bug-severity"
              value={severity}
              onChange={(event) =>
                setSeverity(event.target.value)
              }
            >
              <option value="">All Severities</option>
              <option value="Minor">Minor</option>
              <option value="Major">Major</option>
              <option value="Critical">Critical</option>
              <option value="Blocker">Blocker</option>
            </select>
          </div>

          <div className="bugs-filter-actions">
            <button
              type="button"
              onClick={loadBugs}
              className="bugs-apply-button"
            >
              Apply Filters
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="bugs-clear-button"
            >
              Clear
            </button>
          </div>
        </div>
      </section>

      {/* Results */}

      <section className="bugs-results-card">
        <div className="bugs-results-header">
          <div>
            <h2>
              {search.trim()
                ? "Search Results"
                : "All Bugs"}
            </h2>

            {!loading && !error && (
              <p>
                {bugs.length}{" "}
                {bugs.length === 1
                  ? "issue"
                  : "issues"}{" "}
                found
              </p>
            )}
          </div>

          {!loading && !error && bugs.length > 0 && (
            <div className="bugs-results-count">
              {bugs.length}
            </div>
          )}
        </div>

        {loading && (
          <div className="bugs-loading">
            <div className="loading-spinner" />

            <span>
              Loading bugs...
            </span>
          </div>
        )}

        {error && (
          <div className="bugs-error">
            <div className="bugs-error-icon">
              !
            </div>

            <div>
              <h3>
                Unable to load bugs
              </h3>

              <p>{error}</p>
            </div>
          </div>
        )}

        {!loading &&
          !error &&
          bugs.length === 0 && (
            <div className="bugs-empty">
              <div className="bugs-empty-icon">
                🐞
              </div>

              <h3>No bugs found</h3>

              <p>
                Try changing your search or filters,
                or report a new bug.
              </p>

              <Link
                to="/bugs/create"
                className="bugs-empty-action"
              >
                Report a Bug
              </Link>
            </div>
          )}

        {!loading &&
          !error &&
          bugs.length > 0 && (
            <div className="bugs-table-wrapper">
              <table className="bugs-table">
                <thead>
                  <tr>
                    <th>Bug</th>
                    <th>Project</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Severity</th>
                    <th>Environment</th>
                    <th>Created</th>
                  </tr>
                </thead>

                <tbody>
                  {bugs.map((bug) => (
                    <tr key={bug._id}>
                      <td>
                        <div className="bug-title-cell">
                          <Link
                            to={`/bugs/${bug._id}`}
                            className="bug-title-link"
                          >
                            {bug.title}
                          </Link>

                          <span className="bug-id">
                            #{bug._id.slice(-6)}
                          </span>

                          {bug.tags &&
                            bug.tags.length > 0 && (
                              <div className="bug-tags">
                                {bug.tags
                                  .slice(0, 3)
                                  .map((tag) => (
                                    <span
                                      className="bug-tag"
                                      key={tag}
                                    >
                                      {tag}
                                    </span>
                                ))}
                              </div>
                            )}
                        </div>
                    </td>

                    <td>
                        <span className="bug-project">
                        {bug.project}
                        </span>
                    </td>

                    <td>
                        <span
                        className={`bug-badge ${getStatusClass(
                            bug.status
                        )}`}
                        >
                        {bug.status}
                        </span>
                    </td>

                    <td>
                        <span
                        className={`bug-badge ${getPriorityClass(
                            bug.priority
                        )}`}
                        >
                        {bug.priority}
                        </span>
                    </td>

                    <td>
                        <span
                        className={`bug-badge ${getSeverityClass(
                            bug.severity
                        )}`}
                        >
                        {bug.severity}
                        </span>
                    </td>

                    <td>
                        <span className="bug-environment">
                        {bug.environment || "—"}
                        </span>
                    </td>

                    <td>
                        <span className="bug-created">
                        {new Date(
                            bug.createdAt
                        ).toLocaleDateString()}
                        </span>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        )}
    </section>
    </div>
);
}

export default Bugs;
