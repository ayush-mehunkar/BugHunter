import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!token) {
      setError("Invalid password reset link.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/reset-password", {
        token,
        password,
      });

      setMessage(response.data.message);

      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      console.error("Reset password error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to reset your password. The link may be invalid or expired."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Reset Password</h1>

      <p>Enter your new password below.</p>

      <form onSubmit={handleSubmit}>
        <div>
          <label>New Password</label>
          <br />

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter new password"
            minLength={8}
            required
          />
        </div>

        <br />

        <div>
          <label>Confirm New Password</label>
          <br />

          <input
            type="password"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.target.value)
            }
            placeholder="Confirm new password"
            minLength={8}
            required
          />
        </div>

        <br />

        {error && (
          <div>
            <strong>Error:</strong> {error}
          </div>
        )}

        {message && (
          <div>
            <strong>Success:</strong> {message}
          </div>
        )}

        <br />

        <button type="submit" disabled={loading}>
          {loading ? "Resetting Password..." : "Set New Password"}
        </button>
      </form>

      <br />

      <div>
        <Link to="/login">Back to Login</Link>
      </div>
    </div>
  );
}

export default ResetPassword;
