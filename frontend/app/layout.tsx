import type { Metadata } from "next";
import { Poppins, Hind_Siliguri } from "next/font/google";
import "./globals.css";
import Providers from "@/providers";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "600", "700", "800"],
});

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind-siliguri",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "IK Sociogram",
  description: "IK Sociogram Social Feed",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${poppins.variable} ${hindSiliguri.variable} h-full antialiased`}
    >
      <body className="bg-page text-ink min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
