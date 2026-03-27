import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Footer from "@/src/components/layout/Footer";
import { AuthProvider } from "@/src/contexts/AuthContext";
import { ErrorProvider } from "@/src/contexts/ErrorContext";
import { SpeedInsights } from "@vercel/speed-insights/next";
import SWRProvider from "@/src/lib/swrConfig";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KMUTNB2Market — ตลาดมือสองออนไลน์",
  description: "ซื้อขายสินค้ามือสองและของใหม่ ค้นหาง่าย ราคาโดนใจ",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} antialiased`}
      >
          <ErrorProvider>
            <AuthProvider>
              <SWRProvider>
                {children}
              </SWRProvider>
            </AuthProvider>
          </ErrorProvider>
          <Footer />
        <SpeedInsights />
      </body>
    </html>
  );
}