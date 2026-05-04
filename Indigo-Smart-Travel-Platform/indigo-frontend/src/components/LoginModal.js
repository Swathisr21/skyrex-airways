import React, { useState } from "react";
import axios from "axios";

function LoginModal({ isOpen, onClose, onLogin }) {
  const [view, setView] = useState("login"); // 'login', 'signup', 'forgot'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await axios.post("http://localhost:8080/auth/login", {
        email,
        password
      });

      // ✅ Save user in localStorage with token
      const userData = res.data;
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", userData.token);
      localStorage.setItem("userEmail", userData.email);

      // ✅ Send to App.js
      onLogin(userData);

      // Reset
      setEmail("");
      setPassword("");
      onClose();
      setView("login");

    } catch (err) {
      setError("Invalid email or password");
    }

    setIsLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const res = await axios.post("http://localhost:8080/auth/signup", {
        name,
        email,
        password
      });

      // Save user data with token
      const userData = res.data;
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", userData.token);
      localStorage.setItem("userEmail", userData.email);

      setSuccess("Account created successfully!");
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      
      // Auto-login after signup
      setTimeout(() => {
        onLogin(userData);
        onClose();
        setSuccess("");
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create account. Email may already exist.");
    }

    setIsLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      await axios.post("http://localhost:8080/auth/forgot-password", { email });
      setSuccess("Password reset link sent to your email!");
      setEmail("");
      
      setTimeout(() => {
        setView("login");
        setSuccess("");
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset link. Please try again.");
    }

    setIsLoading(false);
  };

  const switchView = (newView) => {
    setView(newView);
    setError("");
    setSuccess("");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content login-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="login-header">
          <div className="login-logo">
            <span className="logo-icon">✈️</span>
            <h2>SkyRex</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {/* BODY */}
        <div className="login-body">
          {/* LOGIN VIEW */}
          {view === "login" && (
            <>
              <h3>Welcome Back</h3>
              <p>Sign in to access your bookings and manage your trips</p>

              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>

                {error && <div className="error-message">{error}</div>}

                <button
                  type="submit"
                  className="btn-login-submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Sign In"}
                </button>
              </form>

              <div className="login-footer">
                <a href="#forgot" className="forgot-link" onClick={(e) => { e.preventDefault(); switchView("forgot"); }}>
                  Forgot Password?
                </a>
                <div className="signup-link">
                  Don't have an account? <a href="#signup" onClick={(e) => { e.preventDefault(); switchView("signup"); }}>Sign Up</a>
                </div>
              </div>
            </>
          )}

          {/* SIGN UP VIEW */}
          {view === "signup" && (
            <>
              <h3>Create Account</h3>
              <p>Join SkyRex to book flights and manage your trips</p>

              {success && <div className="success-message">{success}</div>}

              <form onSubmit={handleSignup}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password (min 6 characters)"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                  />
                </div>

                {error && <div className="error-message">{error}</div>}

                <button
                  type="submit"
                  className="btn-login-submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Sign Up"}
                </button>
              </form>

              <div className="login-footer">
                <div className="signup-link">
                  Already have an account? <a href="#login" onClick={(e) => { e.preventDefault(); switchView("login"); }}>Sign In</a>
                </div>
              </div>
            </>
          )}

          {/* FORGOT PASSWORD VIEW */}
          {view === "forgot" && (
            <>
              <h3>Reset Password</h3>
              <p>Enter your email address and we'll send you a link to reset your password</p>

              {success && <div className="success-message">{success}</div>}

              <form onSubmit={handleForgotPassword}>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                {error && <div className="error-message">{error}</div>}

                <button
                  type="submit"
                  className="btn-login-submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>

              <div className="login-footer">
                <div className="signup-link">
                  Remember your password? <a href="#login" onClick={(e) => { e.preventDefault(); switchView("login"); }}>Sign In</a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginModal;