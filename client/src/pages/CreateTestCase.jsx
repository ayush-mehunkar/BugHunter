import { useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { createTestCase } from "../services/testCaseService";

const initialFormData = {
  title: "",
  description: "",
  project: "",
  preconditions: "",
  steps: "",
  expectedResult: "",
  priority: "Medium",
  status: "Draft",
  tags: "",
};

function CreateTestCase() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const aiTestSuggestion =
    searchParams.get("aiTest") || "";

  const aiProject =
    searchParams.get("project") || "";

  const aiBugId =
    searchParams.get("bugId") || "";

  const buildInitialFormData = () => {
    if (!aiTestSuggestion) {
      return initialFormData;
    }

    return {
      ...initialFormData,

      title: aiTestSuggestion,

      description:
        "AI-generated verification test based on a reported bug.",

      project: aiProject,

      steps: `1. Execute the scenario described by the AI-generated test suggestion.
2. Observe the application behavior.
3. Compare the actual behavior with the expected result.`,

      expectedResult:
        "The application should behave correctly according to the reported requirement and the expected behavior of the affected workflow.",

      tags: "ai-generated, verification",
    };
  };

  const [formData, setFormData] = useState(
    buildInitialFormData
  );

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!formData.title.trim()) {
      setError("Test case title is required.");
      return;
    }

    if (!formData.project.trim()) {
      setError("Please select a project.");
      return;
    }

    if (!formData.steps.trim()) {
      setError("Test steps are required.");
      return;
    }

    if (!formData.expectedResult.trim()) {
      setError("Expected result is required.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,

        title: formData.title.trim(),

        description:
          formData.description.trim(),

        project:
          formData.project.trim(),

        preconditions:
          formData.preconditions.trim(),

        steps:
          formData.steps.trim(),

        expectedResult:
          formData.expectedResult.trim(),

        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      const result =
        await createTestCase(payload);

      console.log(
        "Test case created successfully:",
        result
      );

      setMessage(
        aiTestSuggestion
          ? "AI-suggested test case created successfully!"
          : "Test case created successfully!"
      );

      setFormData(initialFormData);

      setTimeout(() => {
        navigate("/test-cases");
      }, 1000);
    } catch (error) {
      console.error(
        "Create test case error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to create test case. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-test-case-page">
      <div className="create-test-case-header">
        <div>
          <div className="create-test-case-breadcrumb">
            <Link to="/test-cases">
              QA Management
            </Link>

            <span>/</span>

            <span>Create Test Case</span>
          </div>

          <h1>
            {aiTestSuggestion
              ? "Create AI-Suggested Test Case"
              : "Create Test Case"}
          </h1>

          <p>
            {aiTestSuggestion
              ? "Review and refine the AI-generated verification test before saving it."
              : "Build a structured test scenario for your project."}
          </p>
        </div>

        <Link
          to="/test-cases"
          className="create-test-case-secondary-button"
        >
          ← Back to Test Cases
        </Link>
      </div>

      {aiTestSuggestion && (
        <div className="create-test-case-ai-banner">
          <div className="create-test-case-ai-banner-icon">
            ✦
          </div>

          <div>
            <strong>
              AI-generated test suggestion
            </strong>

            <span>
              BugHunter created this verification test
              from the AI analysis of a reported bug.
              Review the details before creating the
              test case.
            </span>

            {aiBugId && (
              <small>
                Source bug: {aiBugId}
              </small>
            )}
          </div>
        </div>
      )}

      {message && (
        <div className="create-test-case-success">
          <strong>✓ {message}</strong>

          <span>
            Redirecting to Test Cases...
          </span>
        </div>
      )}

      {error && (
        <div className="create-test-case-error">
          <strong>
            Unable to create test case
          </strong>

          <span>{error}</span>
        </div>
      )}

      <form
        className="create-test-case-form"
        onSubmit={handleSubmit}
      >
        <section className="create-test-case-card">
          <div className="create-test-case-card-header">
            <div>
              <h2>Test Case Details</h2>

              <p>
                Define what this test case is intended
                to verify.
              </p>
            </div>
          </div>

          <div className="create-test-case-form-grid">
            <div className="create-test-case-field full-width">
              <label htmlFor="title">
                Test Case Title
                <span>*</span>
              </label>

              <input
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Example: Verify successful user login"
                required
              />
            </div>

            <div className="create-test-case-field full-width">
              <label htmlFor="description">
                Description
              </label>

              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the purpose of this test case..."
                rows="4"
              />
            </div>

            <div className="create-test-case-field">
              <label htmlFor="project">
                Project
                <span>*</span>
              </label>

              <select
                id="project"
                name="project"
                value={formData.project}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select Project
                </option>

                <option value="BugHunter Web Application">
                  BugHunter Web Application
                </option>

                <option value="Mobile Application">
                  Mobile Application
                </option>
              </select>
            </div>

            <div className="create-test-case-field">
              <label htmlFor="priority">
                Priority
              </label>

              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="Low">
                  Low
                </option>

                <option value="Medium">
                  Medium
                </option>

                <option value="High">
                  High
                </option>

                <option value="Critical">
                  Critical
                </option>
              </select>
            </div>

            <div className="create-test-case-field">
              <label htmlFor="status">
                Status
              </label>

              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Draft">
                  Draft
                </option>

                <option value="Ready">
                  Ready
                </option>

                <option value="Deprecated">
                  Deprecated
                </option>
              </select>
            </div>

            <div className="create-test-case-field">
              <label htmlFor="tags">
                Tags
              </label>

              <input
                id="tags"
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="login, authentication, smoke"
              />

              <small>
                Separate multiple tags with commas.
              </small>
            </div>
          </div>
        </section>

        <section className="create-test-case-card">
          <div className="create-test-case-card-header">
            <div>
              <h2>Test Procedure</h2>

              <p>
                Define the conditions, actions and
                expected outcome.
              </p>
            </div>
          </div>

          <div className="create-test-case-field full-width">
            <label htmlFor="preconditions">
              Preconditions
            </label>

            <textarea
              id="preconditions"
              name="preconditions"
              value={formData.preconditions}
              onChange={handleChange}
              placeholder={
                "Example:\n1. User has a valid account\n2. User is on the login page"
              }
              rows="5"
            />
          </div>

          <div className="create-test-case-field full-width">
            <label htmlFor="steps">
              Test Steps
              <span>*</span>
            </label>

            <textarea
              id="steps"
              name="steps"
              value={formData.steps}
              onChange={handleChange}
              placeholder={
                "Example:\n1. Enter a valid email\n2. Enter the correct password\n3. Click Login"
              }
              rows="8"
              required
            />
          </div>

          <div className="create-test-case-field full-width">
            <label htmlFor="expectedResult">
              Expected Result
              <span>*</span>
            </label>

            <textarea
              id="expectedResult"
              name="expectedResult"
              value={formData.expectedResult}
              onChange={handleChange}
              placeholder="Describe what should happen when the test passes..."
              rows="5"
              required
            />
          </div>
        </section>

        <div className="create-test-case-actions">
          <Link
            to="/test-cases"
            className="create-test-case-cancel-button"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="create-test-case-submit-button"
            disabled={loading}
          >
            {loading
              ? "Creating Test Case..."
              : aiTestSuggestion
              ? "Create AI Test Case"
              : "Create Test Case"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateTestCase;
