// useState is a React Hook used to store and update data inside a component
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";
import axios from "axios";
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email: email,
          password: password,
        },
      );

      console.log("Login Response:", response.data);

      // Save token and user information
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // Get role from backend
      const role = response.data.user.role;

      // Role-based redirection
      if (role === "student") {
        navigate("/student/dashboard");
      } else if (role === "faculty") {
        navigate("/faculty/dashboard");
      } else if (role === "admin") {
        navigate("/admin/dashboard");
      } else {
        setError("Invalid user role");
      }
    } catch (error) {
      console.error("Login Error:", error);

      if (error.response) {
        setError(error.response.data.message || "Invalid email or password");
      } else {
        setError("Cannot connect to server");
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Smart Timetable Optimizer</h1>

        <h2>Welcome Back</h2>
        <p>Sign in to your account</p>

        <form onSubmit={handleLogin}>
          <div>
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="login-error">{error}</p>}
          <button type="submit">Sign In</button>
        </form>

        <div className="registration-link">
          <p>Don't have an account?</p>

          <Link to="/student/register">Student Registration</Link>
        </div>

        <div className="back-home">
          <Link to="/">← Back Home</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
