import { useState } from "react";

import { apiFetch } from "../api/api";
import InputField from "../components/common/InputField";

function ChangePasswordPage({ appState }) {
  const { token } = appState;
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const changePassword = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      const data = await apiFetch("/auth/change-password", {
        token,
        method: "PUT",
        body: passwordForm,
      });
      setMessage(data.message);
      setPasswordForm({ currentPassword: "", newPassword: "" });
      appState.persistSession({ token: data.token, user: data.user });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-2xl rounded-[2rem] bg-white p-8 shadow-card">
      <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Account security</p>
      <h1 className="mt-2 font-display text-4xl">Change password</h1>
      <p className="mt-3 text-sm text-ink/60">
        Update your password here instead of from the dashboard.
      </p>
      <form className="mt-6 space-y-4" onSubmit={changePassword}>
        <InputField
          label="Current password"
          type="password"
          value={passwordForm.currentPassword}
          onChange={(value) => setPasswordForm({ ...passwordForm, currentPassword: value })}
        />
        <InputField
          label="New password"
          type="password"
          value={passwordForm.newPassword}
          onChange={(value) => setPasswordForm({ ...passwordForm, newPassword: value })}
        />
        <button
          className="w-full rounded-2xl bg-coral px-4 py-3 font-semibold text-white disabled:opacity-50"
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Updating..." : "Change password"}
        </button>
      </form>
      {message ? (
        <div className="mt-4 rounded-[1.5rem] bg-smoke px-4 py-3 text-sm text-ink">
          {message}
        </div>
      ) : null}
    </section>
  );
}

export default ChangePasswordPage;
