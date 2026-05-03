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

    if (form.password.length < 10) {
      setError("Password must be at least 10 characters long");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
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
      title="Start your blogging journey today."
      subtitle="Create your account, publish your first story, and build your audience from one place."
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
        <h2 className="font-display text-3xl text-white">Register</h2>
        <InputField
          label="Name"
          labelClassName="text-white"
          value={form.name}
          onChange={(value) => updateForm("name", value)}
        />
        <InputField
          label="Username"
          labelClassName="text-white"
          value={form.username}
          onChange={(value) => updateForm("username", value)}
        />
        <InputField
          label="Email"
          type="email"
          labelClassName="text-white"
          value={form.email}
          onChange={(value) => updateForm("email", value)}
        />
        <InputField
          label="Password"
          type="password"
          labelClassName="text-white"
          value={form.password}
          onChange={(value) => updateForm("password", value)}
        />
        <InputField
          label="Confirm password"
          type="password"
          labelClassName="text-white"
          value={form.confirmPassword}
          onChange={(value) => updateForm("confirmPassword", value)}
        />
        <p className="text-sm text-white/70">Use at least 10 characters for your password.</p>
        {message ? <p className="rounded-2xl bg-mint px-4 py-3 text-sm text-ink">{message}</p> : null}
        {error ? <p className="rounded-2xl bg-coral/20 px-4 py-3 text-sm text-red-100">{error}</p> : null}
        <button
          className="w-full rounded-2xl bg-coral px-4 py-3 font-semibold text-white disabled:opacity-50"
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
