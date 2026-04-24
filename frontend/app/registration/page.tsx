import type { Metadata } from "next";
import AuthPage from "@/components/auth/AuthPage";

export const metadata: Metadata = {
  title: "Registration | Buddy Script",
};

export default function RegistrationPage() {
  return <AuthPage mode="registration" />;
}
