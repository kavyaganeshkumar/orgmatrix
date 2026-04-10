// FAKE LOGIN
export function loginUser(email, password) {
  return new Promise((resolve, reject) => {
    if (email === "admin@acme.com" && password === "password123") {
      resolve({
        token: "fake-jwt-token",
        tenantId: "acme"
      });
    } else {
      reject("Invalid credentials");
    }
  });
}

export function registerUser(name, email, password, mobile) {
  return new Promise((resolve, reject) => {
    if (!name || !email || !password || !mobile) {
      reject("All register fields required");
      return;
    }
    resolve({ token: "fake-jwt-token", tenantId: "acme" });
  });
}

// FAKE TASKS
export function getTasks() {
  return [
    { title: "Fix login bug", status: "In Progress" },
    { title: "Prepare Report", status: "Pending" },
    { title: "API Docs", status: "Completed" }
  ];
}