import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  const adminUsername = localStorage.getItem("adminUsername");

  // If admin is logged in, render the component
  if (isAdmin && adminUsername) {
    return children;
  }

  // Otherwise redirect to admin login page
  return <Navigate to="/adminlogin" replace />;
};

export default ProtectedRoute;
