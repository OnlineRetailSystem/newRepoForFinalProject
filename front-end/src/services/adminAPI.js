// Admin API utilities for managing admin accounts
export const AdminAPI = {
  // Create a new admin account
  createAdmin: async (username, password, email) => {
    try {
      const res = await fetch("http://localhost:8081/admin/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, email })
      });
      return await res.json();
    } catch (error) {
      console.error("Error creating admin:", error);
      throw error;
    }
  },

  // Get admin details by username
  getAdmin: async (username) => {
    try {
      const res = await fetch(`http://localhost:8081/admin/${username}`);
      return await res.json();
    } catch (error) {
      console.error("Error fetching admin:", error);
      throw error;
    }
  },

  // Get all admins
  getAllAdmins: async () => {
    try {
      const res = await fetch("http://localhost:8081/admin/list");
      return await res.json();
    } catch (error) {
      console.error("Error fetching admins:", error);
      throw error;
    }
  },

  // Update admin status (ACTIVE or INACTIVE)
  updateAdminStatus: async (username, status) => {
    try {
      const res = await fetch(`http://localhost:8081/admin/${username}/status?status=${status}`, {
        method: "PUT"
      });
      return await res.json();
    } catch (error) {
      console.error("Error updating admin status:", error);
      throw error;
    }
  },

  // Change admin password
  updateAdminPassword: async (username, currentPassword, newPassword) => {
    try {
      const res = await fetch(`http://localhost:8081/admin/${username}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          currentPassword, 
          newPassword 
        })
      });
      return await res.json();
    } catch (error) {
      console.error("Error updating password:", error);
      throw error;
    }
  },

  // Delete admin
  deleteAdmin: async (username) => {
    try {
      const res = await fetch(`http://localhost:8081/admin/${username}`, {
        method: "DELETE"
      });
      return await res.json();
    } catch (error) {
      console.error("Error deleting admin:", error);
      throw error;
    }
  },

  // Check if user is logged in as admin
  isAdminLoggedIn: () => {
    return localStorage.getItem("isAdmin") === "true" && localStorage.getItem("adminUsername");
  },

  // Logout admin
  logoutAdmin: () => {
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("adminUsername");
    localStorage.removeItem("adminEmail");
  },

  // Get current admin username
  getCurrentAdmin: () => {
    return localStorage.getItem("adminUsername");
  }
};
