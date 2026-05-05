import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { apiFetch } from "../api/api";
import AuthShell from "../components/auth/AuthShell";
import InputField from "../components/common/InputField";

const initialForm = {
  email: "",
  password: "",
  token: "",
  newPassword: "",
  confirmNewPassword: "",
};

function LoginPage({ appState }) {
  const navigate = useNavigate();
  const [step, setStep] = useState("login");
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (appState.user) {
    return <Navigate to="/dashboard" replace />;
  }

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const switchStep = (nextStep) => {
    setStep(nextStep);
    setMessage("");
    setError("");
  };

  const completeAuth = async (data) => {
    appState.persistSession({ token: data.token, user: data.user });
    await appState.refresh();
    navigate("/dashboard");
  };

  const submitLogin = async () => {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: { email: form.email, password: form.password },
    });
    await completeAuth(data);
  };

  const submitForgotPassword = async () => {
    if (!form.email.trim()) {
      setFieldErrors({ email: "Enter your email address first." });
      setError("Enter your email address first.");
      return;
    }

    const data = await apiFetch("/auth/forgot-password", {
      method: "POST",
      body: { email: form.email },
    });

    if (!data.resetToken) {
      setMessage(data.message);
      return;
    }

    setForm((current) => ({
      ...current,
      token: data.resetToken,
      newPassword: "",
      confirmNewPassword: "",
    }));
    setMessage(
      `Reset token generated. It expires at ${new Date(data.expiresAt).toLocaleString("en-IN")}.`
    );
    setStep("reset");
  };

  const submitResetPassword = async () => {
    if (form.newPassword.length < 10) {
      setFieldErrors({ newPassword: "Password must be at least 10 characters long." });
      setError("Password must be at least 10 characters long");
      return;
    }

    if (form.newPassword !== form.confirmNewPassword) {
      setFieldErrors({ confirmNewPassword: "New passwords do not match." });
      setError("New passwords do not match");
      return;
    }

    if (!form.token.trim()) {
      setFieldErrors({ token: "Reset token is required." });
      setError("Reset token is required");
      return;
    }

    const data = await apiFetch("/auth/reset-password", {
      method: "POST",
      body: { token: form.token, newPassword: form.newPassword },
    });
    await completeAuth(data);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setFieldErrors({});

    if (!form.email.trim()) {
      setFieldErrors({ email: "Email is required." });
      setError("Enter your email address.");
      return;
    }

    try {
      setSubmitting(true);

      if (step === "login") {
        await submitLogin();
        return;
      }

      if (step === "forgot") {
        await submitForgotPassword();
        return;
      }

      await submitResetPassword();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Sign in and keep your blog moving."
      subtitle="Access your posts, continue writing, moderate comments, and track what readers are responding to."
      footer={
        step === "login" ? (
          <>
            New here?{" "}
            <Link className="font-semibold text-mint" to="/auth/register">
              Create an account
            </Link>
          </>
        ) : (
          <button
            className="font-semibold text-mint"
            onClick={() => switchStep("login")}
            type="button"
          >
            Back to login
          </button>
        )
      }
    >
      <form className="space-y-4" onSubmit={submit}>
        <h2 className="font-display text-4xl text-ink">
          {step === "login" ? "Welcome back" : step === "forgot" ? "Reset access" : "Choose a new password"}
        </h2>
        <p className="text-sm leading-7 text-ink/60">
          {step === "login"
            ? "Sign in to write, publish, and manage your Blogger-style publishing dashboard."
            : step === "forgot"
              ? "Enter your account email to generate a reset token."
              : "Paste your reset token and set a fresh password."}
        </p>

        <InputField
          label="Email"
          type="email"
          labelClassName="text-ink"
          value={form.email}
          onChange={(value) => updateForm("email", value)}
          error={fieldErrors.email}
          required
        />

        {step === "login" ? (
          <InputField
            label="Password"
            type="password"
            labelClassName="text-ink"
            value={form.password}
            onChange={(value) => updateForm("password", value)}
            error={fieldErrors.password}
            required
          />
        ) : null}

        {step === "login" ? (
          <div className="flex justify-end">
            <button
              className="text-sm font-medium text-[#f57c00] transition hover:text-[#d66200]"
              onClick={() => switchStep("forgot")}
              type="button"
            >
              Forgot password?
            </button>
          </div>
        ) : null}

        {step === "forgot" ? (
          <p className="text-sm text-ink/60">
            Use your account email to generate a reset token, then set a new password immediately.
          </p>
        ) : null}

        {step === "reset" ? (
          <>
            <InputField
              label="Reset token"
              labelClassName="text-ink"
              value={form.token}
              onChange={(value) => updateForm("token", value)}
              error={fieldErrors.token}
              required
            />
            <InputField
              label="New password"
              type="password"
              labelClassName="text-ink"
              value={form.newPassword}
              onChange={(value) => updateForm("newPassword", value)}
              error={fieldErrors.newPassword}
              required
            />
            <InputField
              label="Confirm new password"
              type="password"
              labelClassName="text-ink"
              value={form.confirmNewPassword}
              onChange={(value) => updateForm("confirmNewPassword", value)}
              error={fieldErrors.confirmNewPassword}
              required
            />
            <p className="text-sm text-ink/60">Use at least 10 characters for your new password.</p>
          </>
        ) : null}

        {message ? <p className="rounded-2xl bg-mint px-4 py-3 text-sm text-ink">{message}</p> : null}
        {error ? <p className="rounded-2xl bg-coral/12 px-4 py-3 text-sm text-coral">{error}</p> : null}

        <button
          className="w-full rounded-2xl bg-[#f57c00] px-4 py-3 font-semibold text-white disabled:opacity-50"
          type="submit"
          disabled={submitting}
        >
          {step === "login" ? "Login" : step === "forgot" ? "Generate reset token" : "Reset password"}
        </button>
      </form>
    </AuthShell>
  );
}

export default LoginPage;
