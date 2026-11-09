const Auth = {
  getUser() {
    const sessionData = localStorage.getItem(CONFIG.SESSION_KEY);
    return sessionData ? JSON.parse(sessionData) : null;
  },

  setUser(userData) {
    localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(userData));
  },

  logout() {
    localStorage.removeItem(CONFIG.SESSION_KEY);
    window.location.reload();
  },

  async login(usernameOrEmail, password) {
    try {
      const response = await fetch(CONFIG.API_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "login",
          username: usernameOrEmail,
          password: password
        })
      });
      const result = await response.json();
      if (result.status === "success") {
        this.setUser(result.user);
      }
      return result;
    } catch (err) {
      return { status: "error", message: "Gagal terhubung ke server backend." };
    }
  },

  async requestOTP(email) {
    try {
      const response = await fetch(CONFIG.API_URL, {
        method: "POST",
        body: JSON.stringify({ action: "requestOTP", email: email })
      });
      return await response.json();
    } catch (err) {
      return { status: "error", message: "Gagal terhubung ke server." };
    }
  },

  async verifyOTPAndReset(email, otp, newPassword) {
    try {
      const response = await fetch(CONFIG.API_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "verifyOTPAndReset",
          email: email,
          otp: otp,
          newPassword: newPassword
        })
      });
      return await response.json();
    } catch (err) {
      return { status: "error", message: "Gagal memproses reset password." };
    }
  }
};
