// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import "../SignUp/SignUp.css";

// export default function SignUp() {
//   const [form, setForm] = useState({
//     username: "",
//     email: "",
//     password: "",
//     firstName: "",
//     lastName: ""
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const navigate = useNavigate();

//   function handleChange(e) {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   }
//   async function handleSubmit(e) {
//     e.preventDefault();
//     setLoading(true); setError(""); setSuccess("");
//     try {
//       const res = await fetch("http://localhost:8081/signup", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(form)
//       });
//       if (!res.ok) throw new Error("Registration failed");
//       setSuccess("User registered successfully!");
//       setTimeout(() => navigate("/dashboard"), 1200);
//     } catch (err) {
//       setError("Signup failed");
//     }
//     setLoading(false);
//   }

//   return (
//     <div className="auth-bg">
//       <form className="auth-form" onSubmit={handleSubmit} autoComplete="off">
//         <h2 className="auth-title">Sign Up</h2>
//         <div className="auth-fieldgroup">
//           <input name="firstName" className="auth-input" placeholder="First Name"
//             value={form.firstName} onChange={handleChange} autoFocus required />
//         </div>
//         <div className="auth-fieldgroup">
//           <input name="lastName" className="auth-input" placeholder="Last Name"
//             value={form.lastName} onChange={handleChange} required />
//         </div>
//         <div className="auth-fieldgroup">
//           <input name="username" className="auth-input" placeholder="Username"
//             value={form.username} onChange={handleChange} required />
//         </div>
//         <div className="auth-fieldgroup">
//           <input name="email" className="auth-input" placeholder="Email"
//             value={form.email} onChange={handleChange} type="email" required />
//         </div>
//         <div className="auth-fieldgroup">
//           <input name="password" className="auth-input" placeholder="Password"
//             value={form.password} onChange={handleChange} type="password" required />
//         </div>
//         {error && <div className="auth-error">{error}</div>}
//         {success && <div className="auth-success">{success}</div>}
//         <button className="auth-btn" type="submit" disabled={loading}>
//           {loading ? "Signing Up..." : "Sign Up"}
//         </button>
//         <div className="auth-alt">
//           Already have an account?
//           <button type="button" className="auth-link" onClick={() => navigate("/usersign")}>
//             Sign In
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { validatePassword, PASSWORD_REQUIREMENTS, getPasswordStrength } from "../../utils/passwordValidator";
import "../SignUp/SignUp.css";

export default function SignUp() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [passwordChecklist, setPasswordChecklist] = useState({});
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const navigate = useNavigate();

  // Regex patterns
  const patterns = {
    username: /^[a-zA-Z0-9_]{3,20}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    name: /^[a-zA-Z]{2,50}$/
  };

  const errorMessages = {
    username: "Username must be 3-20 characters (letters, numbers, underscore only)",
    email: "Please enter a valid email address",
    firstName: "First name must be 2-50 letters only",
    lastName: "Last name must be 2-50 letters only"
  };

  function validateField(name, value) {
    if (name === "firstName" || name === "lastName") {
      return patterns.name.test(value);
    }
    if (name === "password") {
      return patterns[name]?.test(value) ?? true;
    }
    return patterns[name]?.test(value) ?? true;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: "" });
    }

    // Update password checklist in real-time
    if (name === "password" && value) {
      const validation = validatePassword(value);
      setPasswordChecklist(validation.checklist);
    }
  }

  function handleBlur(e) {
    const { name, value } = e.target;
    
    if (name === "password") {
      if (value) {
        const validation = validatePassword(value);
        if (!validation.isValid) {
          setValidationErrors({ ...validationErrors, [name]: "Password requirements not met" });
        }
      }
      setShowPasswordRequirements(false);
    } else if (value && !validateField(name, value)) {
      setValidationErrors({ ...validationErrors, [name]: errorMessages[name] });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Validate all fields
    const errors = {};
    Object.keys(form).forEach(key => {
      if (!form[key]) {
        errors[key] = "This field is required";
      } else if (key === "password") {
        const validation = validatePassword(form[key]);
        if (!validation.isValid) {
          errors[key] = "Password requirements not met";
        }
      } else if (!validateField(key, form[key])) {
        errors[key] = errorMessages[key];
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError("Please fix all validation errors");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("http://localhost:8081/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle backend validation errors
        if (data.error && typeof data.error === 'string') {
          // If it contains password validation info, make it user-friendly
          if (data.error.includes('Password')) {
            setError("Password does not meet requirements. Please ensure it has: uppercase, lowercase, number, and special character");
          } else {
            setError(data.error);
          }
        } else if (data.message) {
          setError(data.message);
        } else {
          setError("Registration failed. Please try again.");
        }
        return;
      }

      setSuccess("User registered successfully!");
      setForm({ username: "", email: "", password: "", firstName: "", lastName: "" });
      setTimeout(() => navigate("/dashboard"), 1200);

    } catch (err) {
      setError(err.message || "Registration failed. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
<div className="auth-bg">
<form className="auth-form" onSubmit={handleSubmit} autoComplete="off">
<h2 className="auth-title">Sign Up</h2>
<div className="auth-fieldgroup">
<input 

            name="firstName" 

            className="auth-input" 

            placeholder="First Name"

            value={form.firstName} 

            onChange={handleChange}

            onBlur={handleBlur}

            autoFocus 

            required 

          />

          {validationErrors.firstName && (
<span className="validation-error">{validationErrors.firstName}</span>

          )}
</div>
<div className="auth-fieldgroup">
<input 

            name="lastName" 

            className="auth-input" 

            placeholder="Last Name"

            value={form.lastName} 

            onChange={handleChange}

            onBlur={handleBlur}

            required 

          />

          {validationErrors.lastName && (
<span className="validation-error">{validationErrors.lastName}</span>

          )}
</div>
<div className="auth-fieldgroup">
<input 

            name="username" 

            className="auth-input" 

            placeholder="Username"

            value={form.username} 

            onChange={handleChange}

            onBlur={handleBlur}

            required 

          />

          {validationErrors.username && (
<span className="validation-error">{validationErrors.username}</span>

          )}
</div>
<div className="auth-fieldgroup">
<input 

            name="email" 

            className="auth-input" 

            placeholder="Email"

            value={form.email} 

            onChange={handleChange}

            onBlur={handleBlur}

            type="email" 

            required 

          />

          {validationErrors.email && (
<span className="validation-error">{validationErrors.email}</span>

          )}
</div>
<div className="auth-fieldgroup">
          <input 
            name="password" 
            className="auth-input" 
            placeholder="Password"
            value={form.password} 
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={() => setShowPasswordRequirements(true)}
            type="password" 
            required 
          />
          {validationErrors.password && (
            <span className="validation-error">{validationErrors.password}</span>
          )}
          
          {showPasswordRequirements && (
            <div className="password-requirements">
              <div className="requirements-title">Password Requirements:</div>
              {Object.entries(PASSWORD_REQUIREMENTS).map(([key, requirement]) => (
                <div key={key} className={`requirement-item ${passwordChecklist[key] ? 'met' : 'unmet'}`}>
                  <span className="requirement-check">
                    {passwordChecklist[key] ? '✓' : '○'}
                  </span>
                  <span className="requirement-text">{requirement.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <div className="auth-error">{error}</div>}

        {success && <div className="auth-success">{success}</div>}
<button className="auth-btn" type="submit" disabled={loading}>

          {loading ? "Signing Up..." : "Sign Up"}
</button>
<div className="auth-alt">

          Already have an account?
<button type="button" className="auth-link" onClick={() => navigate("/usersign")}>

            Sign In
</button>
</div>
</form>
</div>

  );

}
 
