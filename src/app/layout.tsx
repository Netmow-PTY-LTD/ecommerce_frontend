import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Toaster } from "sonner";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CustomerAuthProvider } from "@/contexts/CustomerAuthContext";
import AdminNavbarProvider from "@/components/admin/admin-navbar-provider";
import MainWrapper from "@/components/admin/main-wrapper";
import { cn } from "@/lib/utils";
import { ChatWidget } from "@/components/chat/chat-widget";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LuxeStore | Premium Ecommerce",
  description: "Modern Ecommerce Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("scroll-smooth", "font-sans", inter.variable)} data-scroll-behavior="smooth">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-background text-foreground`}
      >
        <SettingsProvider>
          <CurrencyProvider>
            <AuthProvider>
              <CustomerAuthProvider>
                <AdminNavbarProvider>
                  <Navbar />
                  <MainWrapper>
                    {children}
                  </MainWrapper>
                  <Footer />
                  <ChatWidget />
                </AdminNavbarProvider>
                <Toaster position="bottom-right" richColors />
              </CustomerAuthProvider>
            </AuthProvider>
          </CurrencyProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
