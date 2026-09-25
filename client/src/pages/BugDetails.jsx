import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getBugById,
  updateBug,
} from "../services/bugService";

import {
  createComment,
  getComments,
  deleteComment,
} from "../services/commentService";

import { getActivities } from "../services/activityService";

import {
  analyzeBug,
  getAIAnalysis,
  checkDuplicateBug,
} from "../services/aiService";

import {
  getAIReview,
  submitAIReview,
} from "../services/aiReviewService";

import {
  getAttachments,
  uploadAttachments,
  deleteAttachment,
} from "../services/attachmentService";

import {
  getTestExecutions,
} from "../services/testExecutionService";

import api from "../services/api";

import {
  canAssignBugs,
  canChangeBugStatus,
} from "../utils/permissionUtils";

import { getCurrentUser } from "../utils/authUtils";

function BugDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [bug, setBug] = useState(null);
  const [users, setUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [relatedTestExecutions, setRelatedTestExecutions] =
    useState([]);
  const [aiAnalysis, setAIAnalysis] = useState(null);
  const [aiReview, setAIReview] = useState(null);
  const [duplicateResult, setDuplicateResult] = useState(null);

  const [aiReviewLoading, setAIReviewLoading] =
    useState(true);
  const [aiReviewSaving, setAIReviewSaving] =
    useState(false);
  const [aiReviewError, setAIReviewError] =
    useState("");
  const [aiReviewComment, setAIReviewComment] =
    useState("");
  const [modifiedPriority, setModifiedPriority] =
    useState("");
  const [modifiedSeverity, setModifiedSeverity] =
    useState("");
  const [modifiedCategory, setModifiedCategory] =
    useState("");

  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [severity, setSeverity] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const [commentText, setCommentText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] =
    useState(true);
  const [attachmentsLoading, setAttachmentsLoading] =
    useState(true);
  const [relatedTestsLoading, setRelatedTestsLoading] =
    useState(true);
  const [aiLoading, setAILoading] = useState(true);

  const [aiAnalyzing, setAIAnalyzing] = useState(false);
  const [duplicateChecking, setDuplicateChecking] =
    useState(false);
  const [attachmentsUploading, setAttachmentsUploading] =
    useState(false);
  const [attachmentDeletingId, setAttachmentDeletingId] =
    useState("");

  const [saving, setSaving] = useState(false);
  const [commentSaving, setCommentSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [commentError, setCommentError] = useState("");
  const [attachmentError, setAttachmentError] =
    useState("");
  const [relatedTestsError, setRelatedTestsError] =
    useState("");
  const [aiError, setAIError] = useState("");
  const [duplicateError, setDuplicateError] =
    useState("");

  const canAssign = canAssignBugs();
  const canChangeStatus = canChangeBugStatus();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        setRelatedTestsError("");

        const requests = [
          getBugById(id),
          getComments(id),
          getActivities(id),
          getAttachments(id),
          getTestExecutions(null, id),
        ];

        if (canAssign) {
          requests.push(api.get("/users"));
        }

        const results = await Promise.all(requests);

        const bugResult = results[0];
        const commentsResult = results[1];
        const activitiesResult = results[2];
        const attachmentsResult = results[3];
        const relatedTestsResult = results[4];
        const usersResult = results[5];

        const loadedBug = bugResult.bug;

        if (!loadedBug) {
          throw new Error("Bug not found");
        }

        setBug(loadedBug);

        setComments(commentsResult?.comments || []);
        setActivities(activitiesResult?.activities || []);
        setAttachments(
          attachmentsResult?.attachments || []
        );

        setRelatedTestExecutions(
          relatedTestsResult?.executions || []
        );

        if (usersResult) {
          setUsers(usersResult.data?.users || []);
        }

        setStatus(loadedBug.status || "");
        setPriority(loadedBug.priority || "");
        setSeverity(loadedBug.severity || "");
        setAssignedTo(loadedBug.assignedTo || "");
      } catch (err) {
        console.error("Load bug details error:", err);

        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load bug details."
        );

        setRelatedTestsError(
          err.response?.data?.message ||
            "Failed to load related test executions."
        );
      } finally {
        setLoading(false);
        setCommentsLoading(false);
        setActivitiesLoading(false);
        setAttachmentsLoading(false);
        setRelatedTestsLoading(false);
      }
    };

    loadData();
  }, [id, canAssign]);

  useEffect(() => {
    const loadAIAnalysis = async () => {
      try {
        setAILoading(true);
        setAIError("");

        const result = await getAIAnalysis(id);

        setAIAnalysis(result.analysis || null);
      } catch (err) {
        if (err.response?.status === 404) {
          setAIAnalysis(null);
        } else {
          console.error("Load AI analysis error:", err);

          setAIError(
            err.response?.data?.message ||
              "Failed to load AI analysis."
          );
        }
      } finally {
        setAILoading(false);
      }
    };

    loadAIAnalysis();
  }, [id]);

  useEffect(() => {
    const loadAIReview = async () => {
      try {
        setAIReviewLoading(true);
        setAIReviewError("");

        const result = await getAIReview(id);

        setAIReview(result.review || null);
      } catch (err) {
        if (err.response?.status === 404) {
          setAIReview(null);
        } else {
          console.error(
            "Load AI review error:",
            err
          );

          setAIReviewError(
            err.response?.data?.message ||
              "Failed to load human review."
          );
        }
      } finally {
        setAIReviewLoading(false);
      }
    };

    loadAIReview();
  }, [id]);

  const handleAnalyzeBug = async () => {
    try {
      setAIAnalyzing(true);
      setAIError("");
      setMessage("");

      const result = await analyzeBug(id);

      setAIAnalysis(result.analysis || null);

      setMessage("AI analysis generated successfully!");
    } catch (err) {
      console.error("AI analysis error:", err);

      setAIError(
        err.response?.data?.message ||
          "Failed to generate AI analysis."
      );
    } finally {
      setAIAnalyzing(false);
    }
  };

  const handleCreateAITestCase = (test) => {
    if (!test) {
      return;
    }

    const params = new URLSearchParams();

    params.set("aiTest", test);

    if (bug?.project) {
      params.set("project", bug.project);
    }

    if (bug?._id) {
      params.set("bugId", bug._id);
    }

    navigate(
      `/test-cases/create?${params.toString()}`
    );
  };

  const handleApplyAIRecommendation = async (
    field,
    value
  ) => {
    if (!value) {
      return;
    }

    try {
      setSaving(true);
      setAIError("");
      setError("");
      setMessage("");

      const updateData = {
        [field]: value,
      };

      const result = await updateBug(id, updateData);

      setBug(result.bug);
      setStatus(result.bug.status);
      setPriority(result.bug.priority);
      setSeverity(result.bug.severity);
      setAssignedTo(result.bug.assignedTo || "");

      setMessage(
        `${
          field === "priority" ? "Priority" : "Severity"
        } applied from AI recommendation.`
      );

      const activitiesResult = await getActivities(id);

      setActivities(activitiesResult.activities || []);
    } catch (err) {
      console.error(
        "Apply AI recommendation error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to apply AI recommendation."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitAIReview = async (decision) => {
    try {
      setAIReviewSaving(true);
      setAIReviewError("");
      setError("");
      setMessage("");

      const reviewData = {
        decision,
        reviewerComment: aiReviewComment.trim(),
        modifiedPriority:
          decision === "Modified"
            ? modifiedPriority
            : null,
        modifiedSeverity:
          decision === "Modified"
            ? modifiedSeverity
            : null,
        modifiedCategory:
          decision === "Modified"
            ? modifiedCategory.trim()
            : "",
      };

      const result = await submitAIReview(
        id,
        reviewData
      );

      setAIReview(result.review || null);

      setMessage(
        `AI review ${
          decision.toLowerCase()
        } successfully.`
      );
    } catch (err) {
      console.error(
        "Submit AI review error:",
        err
      );

      setAIReviewError(
        err.response?.data?.message ||
          "Failed to submit human review."
      );
    } finally {
      setAIReviewSaving(false);
    }
  };

  const handleCheckDuplicates = async () => {
    try {
      setDuplicateChecking(true);
      setDuplicateError("");
      setDuplicateResult(null);

      const result = await checkDuplicateBug(id);

      setDuplicateResult(result);
    } catch (err) {
      console.error(
        "Duplicate bug check error:",
        err
      );

      setDuplicateError(
        err.response?.data?.message ||
          "Failed to check for duplicate bugs."
      );
    } finally {
      setDuplicateChecking(false);
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const updateData = {
        priority,
        severity,
      };

      if (canChangeStatus) {
        updateData.status = status;
      }

      if (canAssign) {
        updateData.assignedTo = assignedTo;
      }

      const result = await updateBug(id, updateData);

      setBug(result.bug);
      setStatus(result.bug.status);
      setPriority(result.bug.priority);
      setSeverity(result.bug.severity);
      setAssignedTo(result.bug.assignedTo || "");

      setMessage("Bug updated successfully!");

      const activitiesResult = await getActivities(id);

      setActivities(activitiesResult.activities || []);
    } catch (err) {
      console.error("Update bug error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to update bug. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async (event) => {
    event.preventDefault();

    if (!commentText.trim()) {
      setCommentError("Comment cannot be empty.");
      return;
    }

    try {
      setCommentSaving(true);
      setCommentError("");

      const result = await createComment(
        id,
        commentText.trim()
      );

      setComments((previousComments) => [
        ...previousComments,
        result.comment,
      ]);

      setCommentText("");
    } catch (err) {
      console.error("Create comment error:", err);

      setCommentError(
        err.response?.data?.message ||
          "Failed to add comment."
      );
    } finally {
      setCommentSaving(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      setCommentError("");

      await deleteComment(commentId);

      setComments((previousComments) =>
        previousComments.filter(
          (comment) => comment._id !== commentId
        )
      );
    } catch (err) {
      console.error("Delete comment error:", err);

      setCommentError(
        err.response?.data?.message ||
          "Failed to delete comment."
      );
    }
  };

  const handleFileSelection = (event) => {
    const files = Array.from(event.target.files || []);

    if (files.length > 5) {
      setAttachmentError(
        "You can upload a maximum of 5 files at once."
      );
      setSelectedFiles(files.slice(0, 5));
      return;
    }

    setAttachmentError("");
    setSelectedFiles(files);
  };

  const handleUploadAttachments = async (event) => {
    event.preventDefault();

    if (selectedFiles.length === 0) {
      setAttachmentError(
        "Please select at least one file."
      );
      return;
    }

    try {
      setAttachmentsUploading(true);
      setAttachmentError("");
      setMessage("");

      const result = await uploadAttachments(
        id,
        selectedFiles
      );

      setAttachments((previousAttachments) => [
        ...previousAttachments,
        ...(result.attachments || []),
      ]);

      setBug(result.bug || bug);
      setSelectedFiles([]);

      const activitiesResult = await getActivities(id);
      setActivities(activitiesResult.activities || []);

      setMessage(
        "Attachments uploaded successfully!"
      );
    } catch (err) {
      console.error(
        "Upload attachments error:",
        err
      );

      setAttachmentError(
        err.response?.data?.message ||
          err.message ||
          "Failed to upload attachments."
      );
    } finally {
      setAttachmentsUploading(false);
    }
  };

  const handleDeleteAttachment = async (
    attachment,
    attachmentIndex
  ) => {
    const isLegacyAttachment =
      typeof attachment === "string";

    if (isLegacyAttachment) {
      setAttachmentError(
        "This attachment uses an older format and cannot be deleted from the current interface."
      );
      return;
    }

    const attachmentId = attachment._id;

    if (!attachmentId) {
      setAttachmentError(
        "This attachment does not have a valid ID."
      );
      return;
    }

    const confirmed = window.confirm(
      `Delete "${attachment.originalName || "this attachment"}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setAttachmentDeletingId(attachmentId);
      setAttachmentError("");
      setMessage("");

      await deleteAttachment(id, attachmentId);

      setAttachments((previousAttachments) =>
        previousAttachments.filter(
          (currentAttachment, currentIndex) =>
            currentIndex !== attachmentIndex
        )
      );

      const activitiesResult = await getActivities(id);
      setActivities(activitiesResult.activities || []);

      setMessage("Attachment deleted successfully.");
    } catch (err) {
      console.error(
        "Delete attachment error:",
        err
      );

      setAttachmentError(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete attachment."
      );
    } finally {
      setAttachmentDeletingId("");
    }
  };

  const getStatusClass = (value) => {
    const classes = {
      Open: "bug-detail-status-open",
      "In Progress": "bug-detail-status-progress",
      Resolved: "bug-detail-status-resolved",
      Closed: "bug-detail-status-closed",
      Reopened: "bug-detail-status-reopened",
    };

    return classes[value] || "bug-detail-status-default";
  };

  const getPriorityClass = (value) => {
    const classes = {
      Low: "bug-detail-priority-low",
      Medium: "bug-detail-priority-medium",
      High: "bug-detail-priority-high",
      Critical: "bug-detail-priority-critical",
    };

    return classes[value] || "bug-detail-priority-default";
  };

  const getSeverityClass = (value) => {
    const classes = {
      Minor: "bug-detail-severity-minor",
      Major: "bug-detail-severity-major",
      Critical: "bug-detail-severity-critical",
      Blocker: "bug-detail-severity-blocker",
    };

    return classes[value] || "bug-detail-severity-default";
  };

  const getActivityClass = (action) => {
    const classes = {
      "Status Changed": "activity-status",
      "Priority Changed": "activity-priority",
      "Severity Changed": "activity-severity",
      "Assignment Changed":
        "activity-assignment",
      "Attachment Added": "activity-attachment",
      "Attachment Deleted":
        "activity-attachment",
    };

    return (
      classes[action] || "activity-default"
    );
  };

  const getActivityLabel = (action) => {
    const labels = {
      "Status Changed": "STATUS",
      "Priority Changed": "PRIORITY",
      "Severity Changed": "SEVERITY",
      "Assignment Changed": "ASSIGNMENT",
      "Attachment Added": "ATTACHMENT",
      "Attachment Deleted": "ATTACHMENT",
    };

    return labels[action] || "ACTIVITY";
  };

  const getExecutionClass = (result) => {
    const classes = {
      Pass: "bug-details-execution-pass",
      Fail: "bug-details-execution-fail",
      Blocked: "bug-details-execution-blocked",
    };

    return (
      classes[result] ||
      "bug-details-execution-default"
    );
  };

  const getRiskClass = (level) => {
    const classes = {
      Low: "bug-details-risk-low",
      Medium: "bug-details-risk-medium",
      "Medium-High":
        "bug-details-risk-medium-high",
      High: "bug-details-risk-high",
    };

    return (
      classes[level] ||
      "bug-details-risk-default"
    );
  };

  const formatAttachmentSize = (size) => {
    if (!size || size <= 0) {
      return "Unknown size";
    }

    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getAttachmentIcon = (mimeType) => {
    if (mimeType?.startsWith("image/")) {
      return "🖼️";
    }

    if (mimeType === "application/pdf") {
      return "📕";
    }

    if (
      mimeType === "text/plain" ||
      mimeType === "text/csv"
    ) {
      return "📄";
    }

    if (mimeType === "application/zip") {
      return "🗜️";
    }

    return "📎";
  };

  if (loading) {
    return (
      <div className="bug-details-page">
        <div className="bug-details-loading">
          <div className="loading-spinner" />
          <span>Loading bug details...</span>
        </div>
      </div>
    );
  }

  if (error && !bug) {
    return (
      <div className="bug-details-page">
        <div className="bug-details-error-page">
          <div className="bug-details-error-icon">
            !
          </div>

          <h2>Unable to load bug</h2>

          <p>{error}</p>

          <Link
            to="/bugs"
            className="bug-details-back-button"
          >
            ← Back to Bugs
          </Link>
        </div>
      </div>
    );
  }

  if (!bug) {
    return (
      <div className="bug-details-page">
        <div className="bug-details-error-page">
          <h2>Bug not found</h2>

          <Link
            to="/bugs"
            className="bug-details-back-button"
          >
            ← Back to Bugs
          </Link>
        </div>
      </div>
    );
  }

  const assignedUser = users.find(
    (user) => user._id === bug.assignedTo
  );

  const investigation =
    Array.isArray(aiAnalysis?.investigation)
      ? aiAnalysis.investigation
      : [];

  const rootCauseHypotheses =
    Array.isArray(aiAnalysis?.rootCauseHypotheses)
      ? aiAnalysis.rootCauseHypotheses
      : [];

  const evidence =
    Array.isArray(aiAnalysis?.evidence)
      ? aiAnalysis.evidence
      : [];

  const suggestedTests =
    Array.isArray(aiAnalysis?.suggestedTests)
      ? aiAnalysis.suggestedTests
      : [];

  const riskLevel =
    aiAnalysis?.riskAssessment?.level || "Medium";

  const riskReason =
    aiAnalysis?.riskAssessment?.reason || "";

  return (
    <div className="bug-details-page">
      {/* PAGE HEADER */}

      <section className="bug-details-header">
        <div className="bug-details-header-top">
          <Link
            to="/bugs"
            className="bug-details-back-link"
          >
            ← Back to Bugs
          </Link>
        </div>

        <div className="bug-details-header-content">
          <div className="bug-details-header-main">
            <div className="bug-details-eyebrow">
              Bug #{bug._id.slice(-6)}
            </div>

            <h1>{bug.title}</h1>

            <p>
              Reported in{" "}
              <strong>{bug.project}</strong>
            </p>
          </div>

          <div className="bug-details-header-badges">
            <span
              className={`bug-detail-badge ${getStatusClass(
                bug.status
              )}`}
            >
              {bug.status}
            </span>

            <span
              className={`bug-detail-badge ${getPriorityClass(
                bug.priority
              )}`}
            >
              {bug.priority} priority
            </span>

            <span
              className={`bug-detail-badge ${getSeverityClass(
                bug.severity
              )}`}
            >
              {bug.severity} severity
            </span>
          </div>
        </div>
      </section>

      {/* TOP SUMMARY */}

      <section className="bug-details-summary-grid">
        <div className="bug-details-summary-card">
          <span className="bug-details-summary-label">
            Status
          </span>

          <strong>{bug.status}</strong>
        </div>

        <div className="bug-details-summary-card">
          <span className="bug-details-summary-label">
            Priority
          </span>

          <strong>{bug.priority}</strong>
        </div>

        <div className="bug-details-summary-card">
          <span className="bug-details-summary-label">
            Severity
          </span>

          <strong>{bug.severity}</strong>
        </div>

        <div className="bug-details-summary-card">
          <span className="bug-details-summary-label">
            Assigned To
          </span>

          <strong>
            {assignedUser?.name || "Unassigned"}
          </strong>
        </div>
      </section>

      {/* DESCRIPTION */}

      <section className="bug-details-card">
        <div className="bug-details-card-header">
          <div>
            <div className="bug-details-section-eyebrow">
              Issue
            </div>

            <h2>Description</h2>
          </div>
        </div>

        <div className="bug-details-description">
          {bug.description}
        </div>
      </section>

      {/* UPDATE BUG */}

      <section className="bug-details-card">
        <div className="bug-details-card-header">
          <div>
            <div className="bug-details-section-eyebrow">
              Workflow
            </div>

            <h2>Update Bug</h2>

            <p>
              Change the workflow state and
              classification of this issue.
            </p>
          </div>
        </div>

        {message && (
          <div className="bug-details-success">
            <span>✓</span>
            <strong>{message}</strong>
          </div>
        )}

        {error && (
          <div className="bug-details-inline-error">
            <span>!</span>
            <strong>{error}</strong>
          </div>
        )}

        <form
          onSubmit={handleUpdate}
          className="bug-details-form"
        >
          <div className="bug-details-form-grid">
            <div className="bug-details-field">
              <label htmlFor="detail-status">
                Status
              </label>

              <select
                id="detail-status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
                disabled={!canChangeStatus}
              >
                <option value="Open">Open</option>
                <option value="In Progress">
                  In Progress
                </option>
                <option value="Resolved">
                  Resolved
                </option>
                <option value="Closed">Closed</option>
                <option value="Reopened">
                  Reopened
                </option>
              </select>

              {!canChangeStatus && (
                <small>
                  You do not have permission to
                  change status.
                </small>
              )}
            </div>

            <div className="bug-details-field">
              <label htmlFor="detail-priority">
                Priority
              </label>

              <select
                id="detail-priority"
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value)
                }
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">
                  Critical
                </option>
              </select>
            </div>

            <div className="bug-details-field">
              <label htmlFor="detail-severity">
                Severity
              </label>

              <select
                id="detail-severity"
                value={severity}
                onChange={(event) =>
                  setSeverity(event.target.value)
                }
              >
                <option value="Minor">Minor</option>
                <option value="Major">Major</option>
                <option value="Critical">
                  Critical
                </option>
                <option value="Blocker">
                  Blocker
                </option>
              </select>
            </div>

            {canAssign && (
              <div className="bug-details-field">
                <label htmlFor="detail-assigned">
                  Assigned To
                </label>

                <select
                  id="detail-assigned"
                  value={assignedTo}
                  onChange={(event) =>
                    setAssignedTo(event.target.value)
                  }
                >
                  <option value="">
                    Unassigned
                  </option>

                  {users.map((user) => (
                    <option
                      key={user._id}
                      value={user._id}
                    >
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="bug-details-form-actions">
            <button
              type="submit"
              className="bug-details-save-button"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </form>
      </section>

      {/* BUG INFORMATION */}

      <section className="bug-details-card">
        <div className="bug-details-card-header">
          <div>
            <div className="bug-details-section-eyebrow">
              Metadata
            </div>

            <h2>Bug Information</h2>
          </div>
        </div>

        <div className="bug-details-info-grid">
          <div className="bug-details-info-item">
            <span>Status</span>
            <strong>{bug.status}</strong>
          </div>

          <div className="bug-details-info-item">
            <span>Priority</span>
            <strong>{bug.priority}</strong>
          </div>

          <div className="bug-details-info-item">
            <span>Severity</span>
            <strong>{bug.severity}</strong>
          </div>

          <div className="bug-details-info-item">
            <span>Project</span>
            <strong>{bug.project}</strong>
          </div>

          <div className="bug-details-info-item">
            <span>Assigned To</span>

            <strong>
              {assignedUser?.name || "Unassigned"}
            </strong>
          </div>

          {bug.environment && (
            <div className="bug-details-info-item">
              <span>Environment</span>
              <strong>{bug.environment}</strong>
            </div>
          )}

          <div className="bug-details-info-item">
            <span>Created</span>

            <strong>
              {new Date(
                bug.createdAt
              ).toLocaleString()}
            </strong>
          </div>

          <div className="bug-details-info-item">
            <span>Last Updated</span>

            <strong>
              {new Date(
                bug.updatedAt
              ).toLocaleString()}
            </strong>
          </div>
        </div>

        {bug.stepsToReproduce && (
          <div className="bug-details-content-block">
            <h3>Steps to Reproduce</h3>
            <pre>{bug.stepsToReproduce}</pre>
          </div>
        )}

        {bug.expectedResult && (
          <div className="bug-details-content-block">
            <h3>Expected Result</h3>
            <p>{bug.expectedResult}</p>
          </div>
        )}

        {bug.actualResult && (
          <div className="bug-details-content-block">
            <h3>Actual Result</h3>
            <p>{bug.actualResult}</p>
          </div>
        )}

        {bug.tags && bug.tags.length > 0 && (
          <div className="bug-details-content-block">
            <h3>Tags</h3>

            <div className="bug-details-tags">
              {bug.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* RELATED TEST EXECUTIONS */}

      <section className="bug-details-card">
        <div className="bug-details-card-header">
          <div>
            <div className="bug-details-section-eyebrow">
              QA Traceability
            </div>

            <h2>Related Test Executions</h2>

            <p>
              Test executions linked to this bug are
              shown here for verification and traceability.
            </p>
          </div>

          <div className="bug-details-count-badge">
            {relatedTestExecutions.length}
          </div>
        </div>

        {relatedTestsError && (
          <div className="bug-details-inline-error">
            <span>!</span>
            <strong>{relatedTestsError}</strong>
          </div>
        )}

        {relatedTestsLoading ? (
          <div className="bug-details-section-loading">
            Loading related test executions...
          </div>
        ) : relatedTestExecutions.length === 0 ? (
          <div className="bug-details-empty-state">
            <span>✓</span>

            <strong>No related test executions</strong>

            <p>
              When a failed test execution is linked to
              this bug, it will appear here.
            </p>

            <Link
              to="/test-cases"
              className="bug-details-related-link"
            >
              View Test Cases →
            </Link>
          </div>
        ) : (
          <div className="bug-details-related-tests-list">
            {relatedTestExecutions.map((execution) => (
              <article
                key={execution._id}
                className="bug-details-related-test"
              >
                <div className="bug-details-related-test-main">
                  <div className="bug-details-related-test-top">
                    <span
                      className={`bug-details-execution-result ${getExecutionClass(
                        execution.result
                      )}`}
                    >
                      {execution.result}
                    </span>

                    <time>
                      {new Date(
                        execution.createdAt
                      ).toLocaleString()}
                    </time>
                  </div>

                  <h3>
                    {execution.testCase?.title ||
                      "Test Case"}
                  </h3>

                  <p>
                    <strong>Project:</strong>{" "}
                    {execution.testCase?.project ||
                      "—"}
                  </p>

                  <p>
                    <strong>Executed By:</strong>{" "}
                    {execution.executedBy?.name ||
                      "Unknown User"}
                  </p>

                  {execution.environment && (
                    <p>
                      <strong>Environment:</strong>{" "}
                      {execution.environment}
                    </p>
                  )}

                  {execution.actualResult && (
                    <div className="bug-details-related-test-result">
                      <span>Actual Result</span>

                      <p>
                        {execution.actualResult}
                      </p>
                    </div>
                  )}

                  {execution.notes && (
                    <div className="bug-details-related-test-notes">
                      <span>Execution Notes</span>

                      <p>{execution.notes}</p>
                    </div>
                  )}
                </div>

                <div className="bug-details-related-test-actions">
                  {execution.testCase?._id && (
                    <Link
                      to={`/test-cases/${execution.testCase._id}`}
                      className="bug-details-related-test-link"
                    >
                      View Test Case →
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ATTACHMENTS */}

      <section className="bug-details-card">
        <div className="bug-details-card-header">
          <div>
            <div className="bug-details-section-eyebrow">
              Evidence
            </div>

            <h2>Attachments</h2>

            <p>
              Add screenshots, logs, documents or other
              evidence related to this bug.
            </p>
          </div>

          <div className="bug-details-count-badge">
            {attachments.length}
          </div>
        </div>

        {attachmentError && (
          <div className="bug-details-inline-error">
            <span>!</span>
            <strong>{attachmentError}</strong>
          </div>
        )}

        {message && (
          <div className="bug-details-success">
            <span>✓</span>
            <strong>{message}</strong>
          </div>
        )}

        <form
          onSubmit={handleUploadAttachments}
          className="bug-details-attachment-form"
        >
          <div className="bug-details-file-input-wrapper">
            <label htmlFor="bug-attachments">
              Select Files
            </label>

            <input
              id="bug-attachments"
              type="file"
              multiple
              onChange={handleFileSelection}
              accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.csv,.zip"
            />

            <small>
              Maximum 5 files per upload. Maximum 10 MB
              per file.
            </small>
          </div>

          {selectedFiles.length > 0 && (
            <div className="bug-details-selected-files">
              <strong>
                Selected files ({selectedFiles.length})
              </strong>

              {selectedFiles.map((file) => (
                <div
                  key={`${file.name}-${file.size}-${file.lastModified}`}
                  className="bug-details-selected-file"
                >
                  <span>📎</span>

                  <span>{file.name}</span>

                  <small>
                    {(file.size / 1024 / 1024).toFixed(
                      2
                    )}{" "}
                    MB
                  </small>
                </div>
              ))}
            </div>
          )}

          <div className="bug-details-attachment-actions">
            <button
              type="submit"
              disabled={
                attachmentsUploading ||
                selectedFiles.length === 0
              }
              className="bug-details-upload-button"
            >
              {attachmentsUploading
                ? "Uploading..."
                : "Upload Attachments"}
            </button>
          </div>
        </form>

        {attachmentsLoading ? (
          <div className="bug-details-section-loading">
            Loading attachments...
          </div>
        ) : attachments.length === 0 ? (
          <div className="bug-details-empty-state">
            <span>📎</span>

            <strong>No attachments yet</strong>

            <p>
              Upload screenshots, logs or other evidence
              to help your team investigate this issue.
            </p>
          </div>
        ) : (
          <div className="bug-details-attachments-list">
            {attachments.map((attachment, index) => {
              const isLegacyAttachment =
                typeof attachment === "string";

              const attachmentUrl =
                isLegacyAttachment
                  ? attachment
                  : attachment.url;

              const attachmentName =
                isLegacyAttachment
                  ? decodeURIComponent(
                      attachment.split("/").pop() || ""
                    )
                  : attachment.originalName ||
                    attachment.storedName ||
                    "Attachment";

              const attachmentType =
                isLegacyAttachment
                  ? ""
                  : attachment.mimeType;

              const attachmentSize =
                isLegacyAttachment
                  ? null
                  : attachment.size;

              const attachmentId =
                isLegacyAttachment
                  ? ""
                  : attachment._id;

              const isDeleting =
                attachmentDeletingId === attachmentId;

              return (
                <div
                  key={
                    `${attachmentUrl}-${index}`
                  }
                  className="bug-details-attachment-item"
                >
                  <a
                    href={attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bug-details-attachment-link"
                  >
                    <div className="bug-details-attachment-icon">
                      {getAttachmentIcon(
                        attachmentType
                      )}
                    </div>

                    <div className="bug-details-attachment-info">
                      <strong>
                        {attachmentName}
                      </strong>

                      <span>
                        {attachmentType ||
                          "Attachment"}
                        {attachmentSize
                          ? ` • ${formatAttachmentSize(
                              attachmentSize
                            )}`
                          : ""}
                      </span>
                    </div>

                    <span className="bug-details-attachment-open">
                      ↗
                    </span>
                  </a>

                  {!isLegacyAttachment && (
                    <button
                      type="button"
                      className="bug-details-delete-attachment"
                      onClick={() =>
                        handleDeleteAttachment(
                          attachment,
                          index
                        )
                      }
                      disabled={isDeleting}
                      aria-label={`Delete ${attachmentName}`}
                    >
                      {isDeleting
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* AI INVESTIGATION */}

      <section className="bug-details-ai-card">
        <div className="bug-details-ai-header">
          <div>
            <div className="bug-details-ai-icon">
              ✦
            </div>

            <div>
              <div className="bug-details-section-eyebrow">
                Intelligence
              </div>

              <h2>AI Bug Investigation</h2>

              <p>
                Let BugHunter analyze this issue,
                investigate possible causes, and suggest
                verification steps.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAnalyzeBug}
            disabled={aiAnalyzing}
            className="bug-details-ai-button"
          >
            {aiAnalyzing
              ? "Analyzing..."
              : "Analyze with AI"}
          </button>
        </div>

        {aiError && (
          <div className="bug-details-inline-error">
            <span>!</span>
            <strong>{aiError}</strong>
          </div>
        )}

        {aiLoading ? (
          <div className="bug-details-ai-loading">
            <div className="loading-spinner" />
            <span>Loading AI analysis...</span>
          </div>
        ) : aiAnalysis ? (
          <div className="bug-details-ai-result">
            {/* AI METRICS */}

            <div className="bug-details-ai-metrics">
              <div>
                <span>Category</span>
                <strong>
                  {aiAnalysis.category || "—"}
                </strong>
              </div>

              <div>
                <span>Priority</span>
                <strong>
                  {aiAnalysis.priorityRecommendation ||
                    "—"}
                </strong>
              </div>

              <div>
                <span>Severity</span>
                <strong>
                  {aiAnalysis.severityRecommendation ||
                    "—"}
                </strong>
              </div>

              <div>
                <span>Confidence</span>
                <strong>
                  {typeof aiAnalysis.confidence ===
                  "number"
                    ? `${aiAnalysis.confidence}%`
                    : "—"}
                </strong>
              </div>
            </div>

            {/* AI RECOMMENDATIONS */}

            <div className="bug-details-ai-actions">
              <div>
                <strong>AI Recommendations</strong>

                <span>
                  Apply recommendations directly to this
                  bug.
                </span>
              </div>

              <div className="bug-details-ai-action-buttons">
                <button
                  type="button"
                  onClick={() =>
                    handleApplyAIRecommendation(
                      "priority",
                      aiAnalysis.priorityRecommendation
                    )
                  }
                  disabled={
                    saving ||
                    !aiAnalysis.priorityRecommendation
                  }
                  className="bug-details-ai-priority-action"
                >
                  Apply Priority:{" "}
                  {aiAnalysis.priorityRecommendation ||
                    "Unavailable"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleApplyAIRecommendation(
                      "severity",
                      aiAnalysis.severityRecommendation
                    )
                  }
                  disabled={
                    saving ||
                    !aiAnalysis.severityRecommendation
                  }
                  className="bug-details-ai-severity-action"
                >
                  Apply Severity:{" "}
                  {aiAnalysis.severityRecommendation ||
                    "Unavailable"}
                </button>
              </div>
            </div>

            {/* CORE AI ANALYSIS */}

            <div className="bug-details-ai-text-grid">
              <div>
                <h3>Summary</h3>

                <p>
                  {aiAnalysis.summary ||
                    "No summary available."}
                </p>
              </div>

              <div>
                <h3>Possible Cause</h3>

                <p>
                  {aiAnalysis.possibleCause ||
                    "No possible cause available."}
                </p>
              </div>

              <div>
                <h3>Suggested Fix</h3>

                <p>
                  {aiAnalysis.suggestedFix ||
                    "No suggested fix available."}
                </p>
              </div>
            </div>

            {/* ROOT CAUSE HYPOTHESES */}

            {rootCauseHypotheses.length > 0 && (
              <div className="bug-details-ai-investigation-section">
                <div className="bug-details-ai-subsection-header">
                  <div className="bug-details-ai-subsection-icon">
                    ⚠
                  </div>

                  <div>
                    <h3>Root Cause Hypotheses</h3>

                    <p>
                      Potential explanations based on the
                      available bug evidence. These are
                      hypotheses, not confirmed root causes.
                    </p>
                  </div>
                </div>

                <div className="bug-details-ai-hypotheses">
                  {rootCauseHypotheses.map(
                    (hypothesis, index) => (
                      <div
                        key={`${hypothesis}-${index}`}
                        className="bug-details-ai-hypothesis"
                      >
                        <span>
                          {index + 1}
                        </span>

                        <p>{hypothesis}</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* INVESTIGATION */}

            {investigation.length > 0 && (
              <div className="bug-details-ai-investigation-section">
                <div className="bug-details-ai-subsection-header">
                  <div className="bug-details-ai-subsection-icon">
                    🔎
                  </div>

                  <div>
                    <h3>Investigation</h3>

                    <p>
                      Recommended checks for narrowing down
                      the cause of this issue.
                    </p>
                  </div>
                </div>

                <div className="bug-details-ai-numbered-list">
                  {investigation.map(
                    (step, index) => (
                      <div
                        key={`${step}-${index}`}
                        className="bug-details-ai-numbered-item"
                      >
                        <span>
                          {index + 1}
                        </span>

                        <p>{step}</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* EVIDENCE */}

            {evidence.length > 0 && (
              <div className="bug-details-ai-investigation-section">
                <div className="bug-details-ai-subsection-header">
                  <div className="bug-details-ai-subsection-icon">
                    ✓
                  </div>

                  <div>
                    <h3>Evidence</h3>

                    <p>
                      Information BugHunter used while
                      generating the analysis.
                    </p>
                  </div>
                </div>

                <div className="bug-details-ai-evidence-list">
                  {evidence.map(
                    (item, index) => (
                      <div
                        key={`${item}-${index}`}
                        className="bug-details-ai-evidence-item"
                      >
                        <span>✓</span>
                        <p>{item}</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* SUGGESTED TESTS */}

            {suggestedTests.length > 0 && (
              <div className="bug-details-ai-investigation-section">
                <div className="bug-details-ai-subsection-header">
                  <div className="bug-details-ai-subsection-icon">
                    ☑
                  </div>

                  <div>
                    <h3>
                      Suggested Verification Tests
                    </h3>

                    <p>
                      Recommended tests to verify the fix
                      before closing the bug.
                    </p>
                  </div>
                </div>

                <div className="bug-details-ai-tests-list">
                  {suggestedTests.map(
                    (test, index) => (
                      <div
                        key={`${test}-${index}`}
                        className="bug-details-ai-test-item"
                      >
                        <span className="bug-details-ai-test-checkbox">
                          □
                        </span>

                        <div className="bug-details-ai-test-content">
                          <strong>
                            Test {index + 1}
                          </strong>

                          <p>{test}</p>
                        </div>

                        <button
                          type="button"
                          className="bug-details-ai-create-test-button"
                          onClick={() =>
                            handleCreateAITestCase(
                              test
                            )
                          }
                        >
                          Create Test Case
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* RISK ASSESSMENT */}

            <div className="bug-details-ai-risk-section">
              <div className="bug-details-ai-risk-header">
                <div>
                  <div className="bug-details-section-eyebrow">
                    Release Impact
                  </div>

                  <h3>Risk Assessment</h3>
                </div>

                <span
                  className={`bug-details-ai-risk-badge ${getRiskClass(
                    riskLevel
                  )}`}
                >
                  {riskLevel}
                </span>
              </div>

              <p>
                {riskReason ||
                  "No additional risk assessment reason was provided."}
              </p>
            </div>

            {aiAnalysis.updatedAt && (
              <div className="bug-details-ai-updated">
                Analysis updated{" "}
                {new Date(
                  aiAnalysis.updatedAt
                ).toLocaleString()}
              </div>
            )}
          </div>
        ) : (
          <div className="bug-details-ai-empty">
            <span>✦</span>

            <strong>No AI analysis yet</strong>

            <p>
              Run AI analysis to get classification,
              investigation steps, root cause hypotheses,
              evidence, suggested verification tests and
              release risk.
            </p>
          </div>
        )}
      </section>

      {/* HUMAN REVIEW */}

      <section className="bug-details-card bug-details-human-review">
        <div className="bug-details-card-header">
          <div>
            <h2>Human Review</h2>
            <p>
              Review the AI recommendation before accepting,
              modifying, or rejecting it.
            </p>
          </div>

          {aiReview && (
            <span className="bug-details-human-review-status">
              {aiReview.decision}
            </span>
          )}
        </div>

        {aiReviewLoading ? (
          <div className="bug-details-ai-empty">
            <span>⏳</span>
            <strong>Loading human review...</strong>
          </div>
        ) : (
          <>
            {aiReviewError && (
              <div className="bug-details-inline-error">
                <span>!</span>
                <strong>{aiReviewError}</strong>
              </div>
            )}

            {aiAnalysis ? (
              <>
                <div className="bug-details-human-review-recommendations">
                  <div>
                    <span>AI Priority</span>
                    <strong>
                      {aiAnalysis.priorityRecommendation ||
                        "Unavailable"}
                    </strong>
                  </div>

                  <div>
                    <span>AI Severity</span>
                    <strong>
                      {aiAnalysis.severityRecommendation ||
                        "Unavailable"}
                    </strong>
                  </div>

                  <div>
                    <span>AI Category</span>
                    <strong>
                      {aiAnalysis.category ||
                        aiAnalysis.categoryRecommendation ||
                        "Unavailable"}
                    </strong>
                  </div>
                </div>

                <div className="bug-details-human-review-field">
                  <label htmlFor="ai-review-comment">
                    Reviewer Comment
                  </label>

                  <textarea
                    id="ai-review-comment"
                    value={aiReviewComment}
                    onChange={(e) =>
                      setAIReviewComment(e.target.value)
                    }
                    placeholder="Explain your decision or add review notes..."
                    rows={4}
                    disabled={aiReviewSaving}
                  />
                </div>

                <div className="bug-details-human-review-modified">
                  <div className="bug-details-human-review-modified-header">
                    <strong>Modified Recommendation</strong>
                    <span>
                      Use these fields only when choosing Modify.
                    </span>
                  </div>

                  <div className="bug-details-human-review-grid">
                    <div className="bug-details-human-review-field">
                      <label htmlFor="modified-priority">
                        Priority
                      </label>

                      <select
                        id="modified-priority"
                        value={modifiedPriority}
                        onChange={(e) =>
                          setModifiedPriority(e.target.value)
                        }
                        disabled={aiReviewSaving}
                      >
                        <option value="">
                          Select priority
                        </option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">
                          Critical
                        </option>
                      </select>
                    </div>

                    <div className="bug-details-human-review-field">
                      <label htmlFor="modified-severity">
                        Severity
                      </label>

                      <select
                        id="modified-severity"
                        value={modifiedSeverity}
                        onChange={(e) =>
                          setModifiedSeverity(e.target.value)
                        }
                        disabled={aiReviewSaving}
                      >
                        <option value="">
                          Select severity
                        </option>
                        <option value="Minor">Minor</option>
                        <option value="Major">Major</option>
                        <option value="Critical">
                          Critical
                        </option>
                        <option value="Blocker">Blocker</option>
                      </select>
                    </div>

                    <div className="bug-details-human-review-field">
                      <label htmlFor="modified-category">
                        Category
                      </label>

                      <input
                        id="modified-category"
                        type="text"
                        value={modifiedCategory}
                        onChange={(e) =>
                          setModifiedCategory(e.target.value)
                        }
                        placeholder="Enter category"
                        disabled={aiReviewSaving}
                      />
                    </div>
                  </div>
                </div>

                <div className="bug-details-human-review-actions">
                  <button
                    type="button"
                    onClick={() =>
                      handleSubmitAIReview("Accepted")
                    }
                    disabled={aiReviewSaving}
                  >
                    {aiReviewSaving
                      ? "Saving..."
                      : "Accept AI Recommendation"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleSubmitAIReview("Modified")
                    }
                    disabled={
                      aiReviewSaving ||
                      !modifiedPriority ||
                      !modifiedSeverity
                    }
                  >
                    Modify Recommendation
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleSubmitAIReview("Rejected")
                    }
                    disabled={aiReviewSaving}
                  >
                    Reject Recommendation
                  </button>
                </div>

                {aiReview && (
                  <>
                    <div className="bug-details-human-review-existing">
                      <strong>Current Review</strong>

                      <div>
                        <span>Decision:</span>{" "}
                        {aiReview.decision}
                    </div>

                    {aiReview.reviewerComment && (
                        <div>
                        <span>Comment:</span>{" "}
                        {aiReview.reviewerComment}
                        </div>
                    )}

                      {aiReview.updatedAt && (
                        <div>
                          <span>Reviewed:</span>{" "}
                          {new Date(
                            aiReview.updatedAt
                          ).toLocaleString()}
                        </div>
                      )}
                    </div>

                    {aiReview.reviewHistory &&
                    aiReview.reviewHistory.length > 0 && (
                        <div className="bug-details-human-review-history">
                          <strong>Review History</strong>

                          <div className="bug-details-human-review-history-list">
                            {[...aiReview.reviewHistory]
                              .reverse()
                              .map((historyItem) => (
                                <div
                                  key={historyItem._id}
                                  className="bug-details-human-review-history-item"
                                >
                                  <div className="bug-details-human-review-history-header">
                                    <span>
                                      {historyItem.decision}
                                    </span>

                                    <small>
                                      {historyItem.createdAt
                                        ? new Date(
                                            historyItem.createdAt
                                          ).toLocaleString()
                                        : ""}
                                    </small>
                                  </div>

                                  {historyItem.reviewer && (
                                    <div className="bug-details-human-review-history-reviewer">
                                      {historyItem.reviewer.name ||
                                        historyItem.reviewer.email ||
                                        "Reviewer"}
                                    </div>
                                  )}

                                  {historyItem.comment && (
                                    <div className="bug-details-human-review-history-comment">
                                      {historyItem.comment}
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                  </>
                )}
              </>
            ) : (
              <div className="bug-details-ai-empty">
                <span>✦</span>

                <strong>No AI analysis available</strong>

                <p>
                  Run AI analysis first. The human reviewer
                  will then be able to accept, modify, or
                  reject the recommendation.
                </p>
              </div>
            )}
          </>
        )}
      </section>

      {/* DUPLICATE DETECTION */}

      <section className="bug-details-card">
        <div className="bug-details-card-header">
          <div>
            <div className="bug-details-section-eyebrow">
              AI Protection
            </div>

            <h2>Duplicate Bug Detection</h2>

            <p>
              Check whether this issue is similar to
              existing bugs.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCheckDuplicates}
            disabled={duplicateChecking}
            className="bug-details-duplicate-button"
          >
            {duplicateChecking
              ? "Checking..."
              : "Check for Duplicates"}
          </button>
        </div>

        {duplicateError && (
          <div className="bug-details-inline-error">
            <span>!</span>
            <strong>{duplicateError}</strong>
          </div>
        )}

        {duplicateResult && (
          <div className="bug-details-duplicate-result">
            {duplicateResult.isDuplicate ? (
              <>
                <div className="bug-details-duplicate-warning">
                  <span>⚠</span>

                  <div>
                    <strong>
                      Possible duplicate bug
                    </strong>

                    <p>
                      BugHunter found{" "}
                      {duplicateResult.matches?.length ||
                        0}{" "}
                      similar bug(s).
                    </p>
                  </div>
                </div>

                <div className="bug-details-duplicate-list">
                  {duplicateResult.matches?.map(
                    (match) => (
                      <div
                        key={match.bugId}
                        className="bug-details-duplicate-item"
                      >
                        <div>
                          <span>Similar Bug</span>

                          <h3>{match.title}</h3>

                          <p>{match.description}</p>

                          <small>
                            Bug ID: {match.bugId}
                          </small>
                        </div>

                        <div className="bug-details-similarity">
                          <span>Similarity</span>

                          <strong>
                            {match.similarity}%
                          </strong>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </>
            ) : (
              <div className="bug-details-no-duplicate">
                <span>✓</span>

                <div>
                  <strong>
                    No duplicate bug found
                  </strong>

                  <p>
                    No sufficiently similar existing
                    bug was detected.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* COMMENTS */}

      <section className="bug-details-card">
        <div className="bug-details-card-header">
          <div>
            <div className="bug-details-section-eyebrow">
              Collaboration
            </div>

            <h2>Comments</h2>

            <p>
              Discuss the issue with your team.
            </p>
          </div>

          <div className="bug-details-count-badge">
            {comments.length}
          </div>
        </div>

        {commentError && (
          <div className="bug-details-inline-error">
            <span>!</span>
            <strong>{commentError}</strong>
          </div>
        )}

        <form
          onSubmit={handleAddComment}
          className="bug-details-comment-form"
        >
          <textarea
            value={commentText}
            onChange={(event) =>
              setCommentText(event.target.value)
            }
            placeholder="Write a comment for your team..."
            rows="4"
          />

          <div className="bug-details-comment-actions">
            <button
              type="submit"
              disabled={commentSaving}
              className="bug-details-comment-button"
            >
              {commentSaving
                ? "Adding..."
                : "Add Comment"}
            </button>
          </div>
        </form>

        {commentsLoading ? (
          <div className="bug-details-section-loading">
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="bug-details-empty-state">
            <span>◌</span>

            <strong>No comments yet</strong>

            <p>
              Start the discussion by adding the first
              comment.
            </p>
          </div>
        ) : (
          <div className="bug-details-comments">
            {comments.map((comment) => {
              const isCommentOwner =
                currentUser?._id ===
                comment.user?._id;

              const isAdmin =
                currentUser?.role === "admin";

              return (
                <article
                  key={comment._id}
                  className="bug-details-comment"
                >
                  <div className="bug-details-comment-avatar">
                    {(comment.user?.name || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="bug-details-comment-content">
                    <div className="bug-details-comment-header">
                      <div>
                        <strong>
                          {comment.user?.name ||
                            "Unknown User"}
                        </strong>

                        <span>
                          {comment.user?.role ||
                            "unknown"}
                        </span>
                      </div>

                      <time>
                        {new Date(
                          comment.createdAt
                        ).toLocaleString()}
                      </time>
                    </div>

                    <p>{comment.text}</p>

                    {(isCommentOwner || isAdmin) && (
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteComment(
                            comment._id
                          )
                        }
                        className="bug-details-delete-comment"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ACTIVITY HISTORY */}

      <section className="bug-details-card">
        <div className="bug-details-card-header">
          <div>
            <div className="bug-details-section-eyebrow">
              Audit Trail
            </div>

            <h2>Activity History</h2>

            <p>
              Changes made to this bug are recorded
              automatically.
            </p>
          </div>

          <div className="bug-details-count-badge">
            {activities.length}
          </div>
        </div>

        {activitiesLoading ? (
          <div className="bug-details-section-loading">
            Loading activity history...
          </div>
        ) : activities.length === 0 ? (
          <div className="bug-details-empty-state">
            <span>◷</span>

            <strong>
              No activity history yet
            </strong>

            <p>
              Bug changes will appear here
              automatically.
            </p>
          </div>
        ) : (
          <div className="bug-details-activity-list">
            {activities.map((activity) => (
              <article
                key={activity._id}
                className={`bug-details-activity ${getActivityClass(
                  activity.action
                )}`}
              >
                <div className="bug-details-activity-marker">
                  ●
                </div>

                <div className="bug-details-activity-content">
                  <div className="bug-details-activity-top">
                    <span className="bug-details-activity-label">
                      {getActivityLabel(
                        activity.action
                      )}
                    </span>

                    <time>
                      {new Date(
                        activity.createdAt
                      ).toLocaleString()}
                    </time>
                  </div>

                <div className="bug-details-activity-user">
                    <strong>
                    {activity.user?.name ||
                        "Unknown User"}
                    </strong>

                    <span>
                    {activity.user?.role ||
                        "unknown"}
                    </span>
                </div>

                <p>
                    <strong>
                    {activity.action}
                    </strong>{" "}
                    — {activity.description}
                </p>
                </div>
            </article>
            ))}
        </div>
        )}
    </section>
    </div>
);
}

export default BugDetails;