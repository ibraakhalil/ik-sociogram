"use client";

import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck, User, UserPlus } from "lucide-react";
import { toast } from "react-toastify";

import { useAuth } from "@/hooks/useAuth";

type AuthPageProps = {
  mode: "login" | "registration";
};

type FormState = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  repeatPassword: string;
};

const authContent = {
  login: {
    title: "Login to your account",
    submitLabel: "Login now",
    switchCopy: "Don't have an account?",
    switchLabel: "Create New Account",
    switchHref: "/registration",
    heroImage: "/images/login.png",
    heroAlt: "Login illustration",
  },
  registration: {
    title: "Create your account",
    submitLabel: "Create account",
    switchCopy: "Already have an account?",
    switchLabel: "Login now",
    switchHref: "/login",
    heroImage: "/images/registration.png",
    heroAlt: "Registration illustration",
  },
} as const;

const initialFormState: FormState = {
  email: "",
  firstName: "",
  lastName: "",
  password: "",
  repeatPassword: "",
};

function AuthInput({
  icon: Icon,
  label,
  name,
  onChange,
  placeholder,
  type,
  value,
}: {
  icon: typeof Mail;
  label: string;
  name: keyof FormState;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  type: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-ink mb-2 block text-sm font-medium">{label}</span>
      <span className="relative block">
        <Icon className="text-subtle pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
        <input
          name={name}
          onChange={onChange}
          placeholder={placeholder}
          type={type}
          value={value}
          className="border-line bg-surface text-ink focus:border-accent/50 focus:ring-accent/10 h-12 w-full rounded-2xl border pr-4 pl-11 text-sm transition outline-none focus:ring-4"
        />
      </span>
    </label>
  );
}

export default function AuthPage({ mode }: AuthPageProps) {
  const content = authContent[mode];
  const isRegistration = mode === "registration";
  const router = useRouter();
  const { isAuthenticated, isReady, login, register } = useAuth();
  const [form, setForm] = useState<FormState>(initialFormState);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isReady, router]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (isRegistration) {
      if (!form.firstName.trim() || !form.lastName.trim()) {
        setError("First name and last name are required.");
        return;
      }

      if (form.password !== form.repeatPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (isRegistration) {
        await register({
          email: form.email.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          password: form.password,
        });
        toast.success("Registration successful! Please login.");
        router.push("/login");
      } else {
        await login({
          email: form.email.trim(),
          password: form.password,
        });
        toast.success("Login successful! Welcome back.");
        router.replace("/");
      }
      setForm(initialFormState);
    } catch (submissionError) {
      const errorMessage =
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to complete the request.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="bg-page relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute top-0 left-0 hidden lg:block">
        <Image
          src="/images/shape1.svg"
          width={174}
          height={220}
          alt=""
          className="h-auto w-[150px] xl:w-[174px]"
        />
      </div>
      <div className="pointer-events-none absolute top-0 right-0 hidden lg:block">
        <Image
          src="/images/shape2.svg"
          width={480}
          height={420}
          alt=""
          className="h-auto w-[360px] xl:w-[480px]"
        />
      </div>
      <div className="pointer-events-none absolute right-[8%] bottom-0 hidden xl:block">
        <Image
          src="/images/shape3.svg"
          width={420}
          height={320}
          alt=""
          className="h-auto w-[360px]"
        />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-[1440px] items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_28rem] lg:px-8 lg:py-16">
        <section className="relative hidden lg:block">
          <div className="relative mx-auto max-w-[660px]">
            <div className="relative mt-10">
              <Image
                src={content.heroImage}
                width={620}
                height={420}
                alt={content.heroAlt}
                className="h-auto w-full"
                priority
              />
              {isRegistration ? (
                <div className="bg-surface absolute right-8 -bottom-2 w-[180px] rounded-lg p-4 shadow-(--shadow-popover)">
                  <div className="flex items-center gap-3">
                    <span className="bg-accent/10 text-accent flex h-11 w-11 items-center justify-center rounded-2xl">
                      <UserPlus className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-ink text-sm font-semibold">Account setup</p>
                      <p className="text-muted text-xs">Ready in a few steps</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[448px]">
          <div className="bg-surface border-line rounded-[32px] border p-6 shadow-(--shadow-panel) sm:p-8">
            <div className="mb-10 text-center">
              <h2 className="text-ink text-[28px] leading-tight font-semibold">{content.title}</h2>
              <p className="text-muted mt-2 text-sm">
                Join Buddy Script and connect with your friends
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {isRegistration ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <AuthInput
                    label="First Name"
                    type="text"
                    placeholder="John"
                    icon={User}
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                  />
                  <AuthInput
                    label="Last Name"
                    type="text"
                    placeholder="Doe"
                    icon={User}
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                  />
                </div>
              ) : null}

              <AuthInput
                label="Email"
                type="email"
                placeholder="you@example.com"
                icon={Mail}
                name="email"
                value={form.email}
                onChange={handleChange}
              />
              <AuthInput
                label="Password"
                type="password"
                placeholder="Enter your password"
                icon={LockKeyhole}
                name="password"
                value={form.password}
                onChange={handleChange}
              />
              {isRegistration ? (
                <AuthInput
                  label="Repeat Password"
                  type="password"
                  placeholder="Repeat your password"
                  icon={ShieldCheck}
                  name="repeatPassword"
                  value={form.repeatPassword}
                  onChange={handleChange}
                />
              ) : null}

              {error ? (
                <div className="border-danger-line bg-danger-surface text-danger-ink rounded-2xl border px-4 py-3 text-sm">
                  {error}
                </div>
              ) : null}

              <div
                className={`flex gap-3 text-sm ${isRegistration ? "items-start" : "items-center justify-between"}`}
              >
                <label className="text-muted flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="border-line text-accent focus:ring-accent/20 h-4 w-4 rounded"
                  />
                  <span>{isRegistration ? "I agree to terms & conditions" : "Remember me"}</span>
                </label>
                {!isRegistration ? (
                  <span className="text-subtle font-medium">JWT session enabled</span>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !isReady}
                className="bg-accent hover:bg-accent-strong disabled:bg-accent/60 text-contrast flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Please wait..." : content.submitLabel}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <p className="text-muted mt-8 text-center text-sm">
              {content.switchCopy}{" "}
              <Link
                href={content.switchHref}
                className="text-accent hover:text-accent-strong font-semibold transition"
              >
                {content.switchLabel}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
