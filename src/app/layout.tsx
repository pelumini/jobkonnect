import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@/services/clerk/components/ClerkProvider";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { UploadThingSSR } from "@/services/uploadthing/components/UploadThingSSR";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JobKonnect",
  description: "The job portal that actually works!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          suppressHydrationWarning
          className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
        >
          {children}
          <Toaster />
          <UploadThingSSR />
        </body>
      </html>
    </ClerkProvider>
  );
}
