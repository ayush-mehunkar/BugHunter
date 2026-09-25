import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setResetUrl("");
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/forgot-password", {
        email,
      });

      setMessage(response.data.message);

      // Development-only reset URL.
      if (response.data.resetUrl) {
        setResetUrl(response.data.resetUrl);
      }
    } catch (error) {
      console.error("Forgot password error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to process your request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Forgot Password</h1>

      <p>
        Enter your email address and we will help you reset your
        password.
      </p>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <br />

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email"
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
          {loading ? "Generating reset link..." : "Reset Password"}
        </button>
      </form>

      {resetUrl && (
        <div>
          <br />

          <strong>Development Reset Link</strong>

          <p>
            Email delivery is not connected yet. Use this link to
            continue the password reset flow during development.
          </p>

          <a href={resetUrl}>
            Continue to Reset Password
          </a>
        </div>
      )}

      <br />

      <div>
        <Link to="/login">Back to Login</Link>
      </div>
    </div>
  );
}

export default ForgotPassword;
