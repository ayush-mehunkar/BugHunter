import { useEffect, useState } from "react";
import {
  cancelInvitation,
  createInvitation,
  getInvitations,
} from "../services/invitationService";

function Invitations() {
  const [invitations, setInvitations] = useState([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("developer");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadInvitations = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getInvitations();

      setInvitations(response.invitations || []);
    } catch (error) {
      console.error("Get invitations error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load invitations. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, []);

  const handleCreateInvitation = async (event) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter an email address.");
      return;
    }

    try {
      setSending(true);
      setError("");
      setSuccess("");

      await createInvitation(normalizedEmail, role);

      setEmail("");
      setRole("developer");

      setSuccess(
        "Invitation created successfully."
      );

      await loadInvitations();
    } catch (error) {
      console.error("Create invitation error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to create invitation."
      );
    } finally {
      setSending(false);
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this invitation?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setCancellingId(invitationId);
      setError("");
      setSuccess("");

      await cancelInvitation(invitationId);

      setSuccess(
        "Invitation cancelled successfully."
      );

      await loadInvitations();
    } catch (error) {
      console.error("Cancel invitation error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to cancel invitation."
      );
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleString();
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "pending":
        return "invitation-status invitation-status-pending";

      case "accepted":
        return "invitation-status invitation-status-accepted";

      case "expired":
        return "invitation-status invitation-status-expired";

      case "cancelled":
        return "invitation-status invitation-status-cancelled";

      default:
        return "invitation-status";
    }
  };

  return (
    <div className="invitations-page">
      <div className="invitations-header">
        <div>
          <h1>Invitations</h1>

          <p>
            Invite developers, testers, and managers to your
            BugHunter organization.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={loadInvitations}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="invitation-alert invitation-alert-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {success && (
        <div className="invitation-alert invitation-alert-success">
          {success}
        </div>
      )}

      <div className="invitation-grid">
        <section className="invitation-card">
          <div className="invitation-card-header">
            <div>
              <h2>Invite team member</h2>

              <p>
                Send an invitation to join your organization.
              </p>
            </div>
          </div>

          <form
            className="invitation-form"
            onSubmit={handleCreateInvitation}
          >
            <div className="form-group">
              <label htmlFor="invitation-email">
                Email address
              </label>

              <input
                id="invitation-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="developer@company.com"
                autoComplete="email"
                disabled={sending}
              />
            </div>

            <div className="form-group">
              <label htmlFor="invitation-role">
                Role
              </label>

              <select
                id="invitation-role"
                value={role}
                onChange={(event) =>
                  setRole(event.target.value)
                }
                disabled={sending}
              >
                <option value="manager">Manager</option>
                <option value="developer">Developer</option>
                <option value="tester">Tester</option>
              </select>
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={sending}
            >
              {sending
                ? "Sending invitation..."
                : "Send invitation"}
            </button>
          </form>

          <div className="invitation-info">
            <strong>Invitation security</strong>

            <p>
              Invitations expire after 48 hours. The invited
              user receives only the role assigned here and
              joins your current organization.
            </p>
          </div>
        </section>

        <section className="invitation-card invitation-summary-card">
          <h2>Invitation summary</h2>

          <div className="invitation-stat">
            <span>Total invitations</span>
            <strong>{invitations.length}</strong>
          </div>

          <div className="invitation-stat">
            <span>Pending</span>
            <strong>
              {
                invitations.filter(
                  (invitation) =>
                    invitation.status === "pending"
                ).length
              }
            </strong>
          </div>

          <div className="invitation-stat">
            <span>Accepted</span>
            <strong>
              {
                invitations.filter(
                  (invitation) =>
                    invitation.status === "accepted"
                ).length
              }
            </strong>
          </div>

          <div className="invitation-stat">
            <span>Cancelled / expired</span>
            <strong>
              {
                invitations.filter(
                  (invitation) =>
                    invitation.status === "cancelled" ||
                    invitation.status === "expired"
                ).length
              }
            </strong>
          </div>
        </section>
      </div>

      <section className="invitation-card invitation-list-card">
        <div className="invitation-card-header">
          <div>
            <h2>Organization invitations</h2>

            <p>
              Track invitations sent to your team members.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="invitation-empty-state">
            <p>Loading invitations...</p>
          </div>
        ) : invitations.length === 0 ? (
          <div className="invitation-empty-state">
            <h3>No invitations yet</h3>

            <p>
              Send your first invitation using the form above.
            </p>
          </div>
        ) : (
          <div className="invitation-table-wrapper">
            <table className="invitation-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Invited by</th>
                  <th>Expires</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {invitations.map((invitation) => (
                  <tr key={invitation._id}>
                    <td>
                      <strong>{invitation.email}</strong>
                    </td>

                    <td>
                      <span className="invitation-role">
                        {invitation.role}
                      </span>
                    </td>

                    <td>
                      <span
                        className={getStatusClass(
                          invitation.status
                        )}
                      >
                        {invitation.status}
                      </span>
                    </td>

                    <td>
                      {invitation.invitedBy?.name ||
                        "—"}
                    </td>

                    <td>
                      {formatDate(
                        invitation.expiresAt
                      )}
                    </td>

                    <td>
                      {formatDate(
                        invitation.createdAt
                      )}
                    </td>

                    <td>
                      {invitation.status === "pending" ? (
                        <button
                          type="button"
                          className="danger-button"
                          onClick={() =>
                            handleCancelInvitation(
                              invitation._id
                            )
                          }
                          disabled={
                            cancellingId === invitation._id
                          }
                        >
                          {cancellingId === invitation._id
                            ? "Cancelling..."
                            : "Cancel"}
                        </button>
                      ) : (
                        <span className="invitation-no-action">
                          —
                        </span>
                      )}
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

export default Invitations;
