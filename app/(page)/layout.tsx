"use client"
import type { Metadata } from "next";
import { Poppins, Geist } from "next/font/google";
import "../globals.css";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SessionProvider } from "next-auth/react";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const PoppinsFont = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        PoppinsFont.variable,
        "font-sans",
        geist.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          <SidebarProvider>
            <AppSidebar />
            <main>{children}</main>
          </SidebarProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
