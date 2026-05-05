import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { apiFetch } from "../api/api";
import AuthShell from "../components/auth/AuthShell";
import InputField from "../components/common/InputField";

const initialForm = {
  name: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function RegisterPage({ appState }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (appState.user) {
    return <Navigate to="/dashboard" replace />;
  }

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Name is required.";
    }

    if (!form.username.trim()) {
      nextErrors.username = "Username is required.";
    } else if (!/^[a-z0-9_]{3,20}$/i.test(form.username.trim())) {
      nextErrors.username = "Use 3-20 letters, numbers, or underscores.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (form.password.length < 10) {
      nextErrors.password = "Password must be at least 10 characters long.";
    }

    if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setError("Fix the highlighted fields and try again.");
      return;
    }

    try {
      setSubmitting(true);
      const data = await apiFetch("/auth/register", {
        method: "POST",
        body: {
          name: form.name,
          username: form.username,
          email: form.email,
          password: form.password,
        },
      });
      appState.persistSession({ token: data.token, user: data.user });
      await appState.refresh();
      navigate("/dashboard");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create your blog and start publishing."
      subtitle="Set up your account, write your first post, and build an audience with a Blogger-style publishing flow."
      footer={
        <>
          Already have an account?{" "}
          <Link className="font-semibold text-mint" to="/auth/login">
            Log in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={submit}>
        <h2 className="font-display text-4xl text-ink">Create account</h2>
        <p className="text-sm leading-7 text-ink/60">
          Start a fresh blog with your profile, categories, tags, analytics, and reader subscriptions ready to grow with you.
        </p>
        <InputField
          label="Name"
          labelClassName="text-ink"
          value={form.name}
          onChange={(value) => updateForm("name", value)}
          error={errors.name}
          required
        />
        <InputField
          label="Username"
          labelClassName="text-ink"
          value={form.username}
          onChange={(value) => updateForm("username", value)}
          error={errors.username}
          required
        />
        <InputField
          label="Email"
          type="email"
          labelClassName="text-ink"
          value={form.email}
          onChange={(value) => updateForm("email", value)}
          error={errors.email}
          required
        />
        <InputField
          label="Password"
          type="password"
          labelClassName="text-ink"
          value={form.password}
          onChange={(value) => updateForm("password", value)}
          error={errors.password}
          required
        />
        <InputField
          label="Confirm password"
          type="password"
          labelClassName="text-ink"
          value={form.confirmPassword}
          onChange={(value) => updateForm("confirmPassword", value)}
          error={errors.confirmPassword}
          required
        />
        <p className="text-sm text-ink/60">Use at least 10 characters for your password.</p>
        {message ? <p className="rounded-2xl bg-mint px-4 py-3 text-sm text-ink">{message}</p> : null}
        {error ? <p className="rounded-2xl bg-coral/12 px-4 py-3 text-sm text-coral">{error}</p> : null}
        <button
          className="w-full rounded-2xl bg-[#f57c00] px-4 py-3 font-semibold text-white disabled:opacity-50"
          type="submit"
          disabled={submitting}
        >
          Create account
        </button>
      </form>
    </AuthShell>
  );
}

export default RegisterPage;
