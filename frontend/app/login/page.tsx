import type { Metadata } from "next";
import AuthPage from "@/components/auth/AuthPage";

export const metadata: Metadata = {
  title: "Login | IK Sociogram",
};

export default function LoginPage() {
  return <AuthPage mode="login" />;
}
