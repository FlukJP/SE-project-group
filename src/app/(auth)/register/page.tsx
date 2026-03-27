"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import { authApi } from "@/src/lib/api";
import EmailOTP from "@/src/components/auth/EmailOTP";
import PhoneOTP from "@/src/components/auth/PhoneOTP";
import { AuthErrorAlert, PasswordField, SelectField, TextField, TextareaField } from "@/src/components/ui";
import { AUTH_TEXT } from "@/src/constants/authText";
import { PROVINCES } from "@/src/data/provinces";
import { getAuthPageFieldClassName, getAuthPageSelectClassName } from "@/src/components/ui/authFieldStyles";
import {
  getPasswordValidationError,
  getPasswordStrength,
  PASSWORD_REQUIREMENTS_HINT,
  PASSWORD_TOGGLE_ARIA_LABELS,
  PASSWORD_PLACEHOLDERS,
} from "@/src/utils/passwordValidation";

function validatePhone(phone: string): string | null {
  const cleaned = phone.replace(/\D/g, "");
  if (!cleaned) return AUTH_TEXT.register.phoneRequired;
  if (!cleaned.startsWith("0")) return AUTH_TEXT.register.phoneMustStartWithZero;
  if (cleaned.length !== 10) return AUTH_TEXT.register.phoneMustBeTenDigits;
  return null;
}

function validateEmail(email: string): string | null {
  if (!email.trim()) return AUTH_TEXT.register.emailRequired;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return AUTH_TEXT.register.invalidEmail;
  return null;
}

export default function RegisterPage() {
  const router = useRouter();
  const { isLoggedIn, setTokensAndLoadUser } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "email-otp" | "phone-otp">("form");
  const [addressDetail, setAddressDetail] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const selectedProvinceData = PROVINCES.find((p) => p.name === province);

  useEffect(() => {
    if (isLoggedIn) router.replace("/");
  }, [isLoggedIn, router]);

  if (isLoggedIn) return null;

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const usernameError = touched.username && !username.trim() ? AUTH_TEXT.register.usernameRequired : null;
  const emailError = touched.email ? validateEmail(email) : null;
  const phoneError = touched.phone ? validatePhone(phone) : null;
  const passwordError = touched.password ? getPasswordValidationError(password) : null;
  const confirmError = touched.confirmPassword && confirmPassword.length > 0 && password !== confirmPassword
    ? AUTH_TEXT.register.passwordMismatch
    : null;
  const addressDetailError = touched.addressDetail && !addressDetail.trim() ? AUTH_TEXT.register.addressRequired : null;
  const provinceError = touched.province && !province ? AUTH_TEXT.register.provinceRequired : null;
  const districtError = touched.district && !district ? AUTH_TEXT.register.districtRequired : null;

  const pwStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setTouched({
      username: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
      addressDetail: true,
      province: true,
      district: true,
    });

    if (!username.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      setError(AUTH_TEXT.register.fillAllFields);
      return;
    }

    const emailValidationError = validateEmail(email);
    if (emailValidationError) {
      setError(emailValidationError);
      return;
    }

    const phoneValidationError = validatePhone(phone);
    if (phoneValidationError) {
      setError(phoneValidationError);
      return;
    }

    const passwordValidationError = getPasswordValidationError(password);
    if (passwordValidationError) {
      setError(passwordValidationError);
      return;
    }

    if (password !== confirmPassword) {
      setError(AUTH_TEXT.register.passwordMismatch);
      return;
    }

    if (!addressDetail.trim()) {
      setError(AUTH_TEXT.register.addressRequired);
      return;
    }

    if (!province) {
      setError(AUTH_TEXT.register.provinceRequired);
      return;
    }

    if (!district) {
      setError(AUTH_TEXT.register.districtRequired);
      return;
    }

    const fullAddress = [addressDetail.trim(), district, province, postalCode.trim()]
      .filter(Boolean)
      .join(" ");

    setError("");
    setLoading(true);
    try {
      await authApi.register({
        username: username.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        address: fullAddress,
      });
      setStep("email-otp");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : AUTH_TEXT.register.failed);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerified = async (data: { access_token: string; refresh_token: string }) => {
    try {
      await setTokensAndLoadUser(data.access_token, data.refresh_token);
      setError("");
      setStep("phone-otp");
    } catch {
      setError(AUTH_TEXT.register.emailAutoLoginFailed);
    }
  };

  const handlePhoneVerified = async (data: { idToken: string }) => {
    try {
      const result = await authApi.verifyPhoneFirebase(data.idToken);
      await setTokensAndLoadUser(result.access_token, result.refresh_token);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : AUTH_TEXT.register.phoneVerifyFailed);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F6F0] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-[#E6D5C3] p-8">
        {step === "form" && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#E6D5C3] mb-4">
                <span className="text-3xl">📝</span>
              </div>
              <h1 className="text-2xl font-bold text-[#4A3B32]">{AUTH_TEXT.register.title}</h1>
              <p className="text-sm text-[#A89F91] mt-1">{AUTH_TEXT.register.subtitle}</p>
            </div>

            {error && <AuthErrorAlert message={error} />}

            <form onSubmit={handleSubmit} className="space-y-4">
              <TextField
                label={AUTH_TEXT.common.usernameLabel}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => markTouched("username")}
                placeholder={AUTH_TEXT.common.usernamePlaceholder}
                autoComplete="username"
                error={usernameError}
                inputClassName={getAuthPageFieldClassName(!!usernameError)}
              />

              <TextField
                label={AUTH_TEXT.common.emailLabel}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => markTouched("email")}
                placeholder={AUTH_TEXT.common.emailPlaceholder}
                autoComplete="email"
                error={emailError}
                inputClassName={getAuthPageFieldClassName(!!emailError)}
              />

              <TextField
                label={AUTH_TEXT.common.phoneLabel}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => markTouched("phone")}
                placeholder={AUTH_TEXT.common.phonePlaceholder}
                autoComplete="tel"
                error={phoneError}
                inputClassName={getAuthPageFieldClassName(!!phoneError)}
              />

              <div>
                <PasswordField
                  label={AUTH_TEXT.common.passwordLabel}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => markTouched("password")}
                  placeholder={PASSWORD_PLACEHOLDERS.password}
                  autoComplete="new-password"
                  showAriaLabel={PASSWORD_TOGGLE_ARIA_LABELS.show}
                  hideAriaLabel={PASSWORD_TOGGLE_ARIA_LABELS.hide}
                  error={passwordError}
                  hint={PASSWORD_REQUIREMENTS_HINT}
                  inputClassName={getAuthPageFieldClassName(!!passwordError)}
                />
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${i <= pwStrength.level ? pwStrength.color : "bg-[#E6D5C3]"}`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-[#A89F91] mt-1">{pwStrength.label}</p>
                  </div>
                )}
              </div>

              <PasswordField
                label={AUTH_TEXT.common.confirmPasswordLabel}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => markTouched("confirmPassword")}
                placeholder={PASSWORD_PLACEHOLDERS.confirmPassword}
                autoComplete="new-password"
                showAriaLabel={PASSWORD_TOGGLE_ARIA_LABELS.showConfirm}
                hideAriaLabel={PASSWORD_TOGGLE_ARIA_LABELS.hideConfirm}
                error={confirmError}
                inputClassName={getAuthPageFieldClassName(!!confirmError)}
              />

              <div className="pt-2">
                <p className="text-sm font-semibold text-[#4A3B32] mb-3">{AUTH_TEXT.register.shippingAddressTitle}</p>

                <div className="space-y-3">
                  <TextareaField
                    label={AUTH_TEXT.register.addressDetailLabel}
                    value={addressDetail}
                    onChange={(e) => setAddressDetail(e.target.value)}
                    onBlur={() => markTouched("addressDetail")}
                    placeholder={AUTH_TEXT.register.addressDetailPlaceholder}
                    rows={3}
                    error={addressDetailError}
                    textareaClassName={`${getAuthPageFieldClassName(!!addressDetailError)} resize-y min-h-[104px]`}
                  />

                  <SelectField
                    label={AUTH_TEXT.register.provinceLabel}
                    aria-label={AUTH_TEXT.register.provinceLabel}
                    value={province}
                    onChange={(e) => { setProvince(e.target.value); setDistrict(""); }}
                    onBlur={() => markTouched("province")}
                    error={provinceError}
                    selectClassName={getAuthPageSelectClassName(!!provinceError)}
                  >
                      <option value="">{AUTH_TEXT.register.provincePlaceholder}</option>
                      {PROVINCES.map((p) => (
                        <option key={p.name} value={p.name}>{p.name}</option>
                      ))}
                    </SelectField>

                  <SelectField
                    label={AUTH_TEXT.register.districtLabel}
                    aria-label={AUTH_TEXT.register.districtLabel}
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    onBlur={() => markTouched("district")}
                    disabled={!province}
                    error={districtError}
                    selectClassName={getAuthPageSelectClassName(!!districtError, true)}
                  >
                      <option value="">{AUTH_TEXT.register.districtPlaceholder}</option>
                      {selectedProvinceData?.districts.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </SelectField>

                  <TextField
                    label={`${AUTH_TEXT.register.postalCodeLabel} ${AUTH_TEXT.register.optional}`}
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                    placeholder={AUTH_TEXT.register.postalCodePlaceholder}
                    maxLength={5}
                    inputClassName={getAuthPageFieldClassName()}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#D9734E] text-white font-semibold hover:bg-[#C25B38] transition disabled:opacity-50"
              >
                {loading ? AUTH_TEXT.register.loading : AUTH_TEXT.register.submit}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-[#A89F91]">
              {AUTH_TEXT.register.haveAccount}{" "}
              <Link href="/login" className="text-[#D9734E] font-semibold hover:underline">
                {AUTH_TEXT.register.signIn}
              </Link>
            </div>

            <div className="mt-4 text-center">
              <Link href="/" className="text-sm text-[#A89F91] hover:text-[#4A3B32]">
                {AUTH_TEXT.register.backHome}
              </Link>
            </div>
          </>
        )}

        {step === "email-otp" && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#E6D5C3] mb-4">
                <span className="text-3xl">📧</span>
              </div>
              <h1 className="text-2xl font-bold text-[#4A3B32]">{AUTH_TEXT.register.emailOtpTitle}</h1>
              <p className="text-sm text-[#A89F91] mt-1">{AUTH_TEXT.register.emailOtpSubtitle}</p>
            </div>

            {error && <AuthErrorAlert message={error} />}

            <EmailOTP
              email={email}
              onVerified={handleEmailVerified}
              onError={(msg) => setError(msg)}
            />

            <div className="mt-6 text-center">
              <button
                onClick={() => router.push("/login")}
                className="text-sm text-[#A89F91] hover:text-[#4A3B32]"
              >
                {AUTH_TEXT.register.emailSkip}
              </button>
            </div>
          </>
        )}

        {step === "phone-otp" && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <span className="text-3xl">📱</span>
              </div>
              <h1 className="text-2xl font-bold text-[#4A3B32]">{AUTH_TEXT.register.phoneOtpTitle}</h1>
              <p className="text-sm text-[#A89F91] mt-1">{AUTH_TEXT.register.phoneOtpSubtitle}</p>
            </div>

            {error && <AuthErrorAlert message={error} />}

            <PhoneOTP
              phone={phone}
              onVerified={handlePhoneVerified}
              onError={(msg) => setError(msg)}
            />

            <div className="mt-6 text-center">
              <button
                onClick={() => router.push("/")}
                className="text-sm text-[#A89F91] hover:text-[#4A3B32]"
              >
                {AUTH_TEXT.register.phoneSkip}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
