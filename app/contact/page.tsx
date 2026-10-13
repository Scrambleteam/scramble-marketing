"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { SCRAMBLE_THEME } from "@/lib/scramble-theme";
import { PublicNav, PublicFooter, PUBLIC_CHROME_STYLES } from "@/components/PublicSiteChrome";
import { EnquiryErrors, EnquiryInput, validateEnquiry } from "@/lib/enquiry";

const EMPTY_FORM: EnquiryInput = {
  name: "",
  email: "",
  company: "",
  website: "",
  message: "",
  consent: false,
};

export default function ContactPage() {
  const [form, setForm] = useState<EnquiryInput>(EMPTY_FORM);
  const [errors, setErrors] = useState<EnquiryErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submittedName, setSubmittedName] = useState<string | null>(null);

  const update = <K extends keyof EnquiryInput>(key: K, value: EnquiryInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    const trimmed: EnquiryInput = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      company: form.company.trim(),
      website: form.website.trim(),
      message: form.message.trim(),
    };
    const clientErrors = validateEnquiry(trimmed);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trimmed),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        const details = json?.error?.details;
        if (details && typeof details === "object") setErrors(details as EnquiryErrors);
        setSubmitError(json?.error?.message || "We couldn't send your enquiry. Please try again.");
        return;
      }

      setSubmittedName(trimmed.name);
    } catch {
      setSubmitError("We couldn't send your enquiry. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sc-root">
      <style>{SCRAMBLE_THEME}</style>
      <style>{PUBLIC_CHROME_STYLES}</style>
      <style>{contactStyles}</style>

      <PublicNav />

      {/* Header */}
      <section className="contact-head">
        <div className="sc-eyebrow">Contact</div>
        <h1 className="contact-title">
          Start a <span className="sc-gradient-gold">conversation</span>
        </h1>
        <p className="contact-sub">
          Tell us a little about your business and what you&apos;re looking to achieve.
          We&apos;ll be in touch as soon as possible, usually within one working day.
        </p>
      </section>

      <section className="contact-wrap">
        <div className="contact-grid">
          {/* Form */}
          <div className="sc-card contact-form-card">
            {submittedName !== null ? (
              <div className="sc-success contact-thanks" role="status">
                Thank you, {submittedName}. Your enquiry has reached us, and we&apos;ll be in
                touch shortly.
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <Field label="Name" required error={errors.name}>
                  <input
                    id="name"
                    className="sc-input"
                    type="text"
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    aria-invalid={!!errors.name}
                    required
                  />
                </Field>

                <Field label="Email" required error={errors.email}>
                  <input
                    id="email"
                    className="sc-input"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    aria-invalid={!!errors.email}
                    required
                  />
                </Field>

                <Field label="Company" error={errors.company}>
                  <input
                    id="company"
                    className="sc-input"
                    type="text"
                    autoComplete="organization"
                    value={form.company}
                    onChange={(e) => update("company", e.target.value)}
                    aria-invalid={!!errors.company}
                  />
                </Field>

                <Field label="Website" error={errors.website}>
                  <input
                    id="website"
                    className="sc-input"
                    type="text"
                    inputMode="url"
                    autoComplete="url"
                    placeholder="example.com"
                    value={form.website}
                    onChange={(e) => update("website", e.target.value)}
                    aria-invalid={!!errors.website}
                  />
                </Field>

                <Field label="How can we help?" error={errors.message}>
                  <textarea
                    id="message"
                    className="sc-input contact-textarea"
                    rows={5}
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                    aria-invalid={!!errors.message}
                  />
                </Field>

                <div className="contact-field">
                  <label className="contact-consent">
                    <input
                      type="checkbox"
                      checked={form.consent}
                      onChange={(e) => update("consent", e.target.checked)}
                      aria-invalid={!!errors.consent}
                      required
                    />
                    <span>
                      I agree to Scramble&apos;s{" "}
                      <Link href="/privacy-policy" className="sc-link" target="_blank">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                  {errors.consent && <p className="contact-error">{errors.consent}</p>}
                </div>

                {submitError && <div className="sc-error contact-submit-error">{submitError}</div>}

                <button type="submit" className="sc-btn-primary" disabled={loading}>
                  {loading ? "Sending…" : "Send enquiry"}
                </button>
              </form>
            )}
          </div>

          {/* Other ways to reach us */}
          <aside className="contact-aside">
            <h2>Other ways to reach us</h2>
            <a href="https://wa.me/447304025648" target="_blank" rel="noopener noreferrer" className="contact-method">
              <span className="contact-method-label">WhatsApp</span>
              <span className="contact-method-value">+44 7304 025648</span>
            </a>
            <a href="mailto:helloscrambleteam@gmail.com" className="contact-method">
              <span className="contact-method-label">Email</span>
              <span className="contact-method-value">helloscrambleteam@gmail.com</span>
            </a>
          </aside>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactElement<{ id: string }>;
}) {
  return (
    <div className="contact-field">
      <label htmlFor={children.props.id} className="sc-label">
        {label}
        {required && <span className="contact-required"> *</span>}
      </label>
      {children}
      {error && <p className="contact-error">{error}</p>}
    </div>
  );
}

const contactStyles = `
  .sc-eyebrow {
    display: inline-block; font-size: 13px; font-weight: 700; letter-spacing: 1.5px;
    text-transform: uppercase; color: #4a9eff; margin-bottom: 14px;
  }
  .contact-head { text-align: center; padding: 150px 28px 40px; max-width: 720px; margin: 0 auto; }
  .contact-title { font-size: 48px; font-weight: 800; letter-spacing: -1.5px; line-height: 1.1; margin-bottom: 18px; }
  .contact-sub { font-size: 19px; color: #5a6b82; line-height: 1.6; }

  .contact-wrap { padding: 20px 28px 100px; }
  .contact-grid {
    max-width: 1000px; margin: 0 auto;
    display: grid; grid-template-columns: 1.6fr 1fr; gap: 28px; align-items: start;
  }
  .contact-form-card { padding: 36px 32px; }
  .contact-field { margin-bottom: 18px; }
  .contact-required { color: #e89b1f; }
  .contact-textarea { resize: vertical; min-height: 120px; }
  .contact-error { margin-top: 6px; font-size: 13px; color: #c0392b; font-weight: 500; }
  .contact-submit-error { margin-bottom: 18px; }
  .contact-thanks { font-size: 16px; padding: 20px; line-height: 1.6; }

  .contact-consent { display: flex; align-items: flex-start; gap: 10px; font-size: 15px; color: #3a4a62; cursor: pointer; }
  .contact-consent input { margin-top: 3px; width: 18px; height: 18px; accent-color: #4a9eff; flex-shrink: 0; }

  .contact-aside h2 { font-size: 20px; font-weight: 800; margin-bottom: 16px; }
  .contact-method {
    display: flex; flex-direction: column; gap: 4px; text-decoration: none;
    background: rgba(255,255,255,0.92); border: 1px solid rgba(122, 178, 255, 0.16);
    border-radius: 18px; padding: 18px 22px; margin-bottom: 14px;
    box-shadow: 0 10px 30px rgba(45, 127, 224, 0.06);
    transition: all 0.3s;
  }
  .contact-method:hover { transform: translateY(-2px); box-shadow: 0 14px 34px rgba(45, 127, 224, 0.12); }
  .contact-method-label { font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #4a9eff; }
  .contact-method-value { font-size: 16px; font-weight: 600; color: #16243a; word-break: break-all; }

  @media (max-width: 900px) {
    .contact-grid { grid-template-columns: 1fr; }
    .contact-title { font-size: 36px; }
    .contact-form-card { padding: 28px 22px; }
  }
`;
