import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  acceptInvitation,
  validateInvitation,
} from "../services/invitationService";

function AcceptInvitation() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState(null);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setError("Invalid invitation link.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await validateInvitation(token);

        setInvitation(response.invitation);
      } catch (error) {
        console.error("Invitation validation error:", error);

        setError(
          error.response?.data?.message ||
            "This invitation is invalid or has expired."
        );
      } finally {
        setLoading(false);
      }
    };

    validate();
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setAccepting(true);
      setError("");

      const response = await acceptInvitation(
        token,
        name.trim(),
        password
      );

      localStorage.setItem("token", response.token);
      localStorage.setItem(
        "user",
        JSON.stringify(response.user)
      );

      navigate("/dashboard");
    } catch (error) {
      console.error("Accept invitation error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to accept this invitation."
      );
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="invitation-auth-page">
        <div className="invitation-auth-card">
          <div className="invitation-auth-brand">
            <div className="brand-icon">🐛</div>

            <div>
              <div className="brand-name">BugHunter</div>
              <div className="brand-subtitle">
                QA Management
              </div>
            </div>
          </div>

          <div className="invitation-auth-loading">
            <h1>Checking invitation</h1>
            <p>Please wait while we validate your invitation.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="invitation-auth-page">
        <div className="invitation-auth-card">
          <div className="invitation-auth-brand">
            <div className="brand-icon">🐛</div>

            <div>
              <div className="brand-name">BugHunter</div>
              <div className="brand-subtitle">
                QA Management
              </div>
            </div>
          </div>

          <div className="invitation-auth-error">
            <div className="invitation-auth-error-icon">
              !
            </div>

            <h1>Invitation unavailable</h1>

            <p>{error}</p>

            <Link
              to="/login"
              className="invitation-auth-link-button"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="invitation-auth-page">
      <div className="invitation-auth-card">
        <div className="invitation-auth-brand">
          <div className="brand-icon">🐛</div>

          <div>
            <div className="brand-name">BugHunter</div>
            <div className="brand-subtitle">
              QA Management
            </div>
          </div>
        </div>

        <div className="invitation-auth-header">
          <h1>Join BugHunter</h1>

          <p>
            You've been invited to join an organization on
            BugHunter.
          </p>
        </div>

        <div className="invitation-details">
          <div className="invitation-detail">
            <span>Email</span>
            <strong>{invitation?.email}</strong>
          </div>

          <div className="invitation-detail">
            <span>Role</span>
            <strong>
              {invitation?.role}
            </strong>
          </div>

          <div className="invitation-detail">
            <span>Organization</span>
            <strong>
              {invitation?.organizationName}
            </strong>
          </div>
        </div>

        {error && (
          <div className="invitation-alert invitation-alert-error">
            <strong>Error:</strong> {error}
          </div>
        )}

        <form
          className="invitation-auth-form"
          onSubmit={handleSubmit}
        >
          <div className="form-group">
            <label htmlFor="accept-name">
              Your name
            </label>

            <input
              id="accept-name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Enter your name"
              autoComplete="name"
              disabled={accepting}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="accept-password">
              Password
            </label>

            <input
              id="accept-password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Create a password"
              autoComplete="new-password"
              disabled={accepting}
              minLength={8}
              required
            />

            <small>
              Password must contain at least 8 characters.
            </small>
          </div>

          <button
            type="submit"
            className="primary-button invitation-accept-button"
            disabled={accepting}
          >
            {accepting
              ? "Joining BugHunter..."
              : "Accept invitation"}
          </button>
        </form>

        <div className="invitation-auth-footer">
          <span>Already have an account?</span>{" "}
          <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}

export default AcceptInvitation;
