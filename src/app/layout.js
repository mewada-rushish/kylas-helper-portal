import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import NextAuthSessionProvider from "@/components/providers/session-provider";
import prisma from "@/lib/prisma";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export async function generateMetadata() {
  try {
    const settings = await prisma.systemSetting.findUnique({ where: { id: "default" } });
    return {
      title: settings?.companyName || "Kylas Helper Portal",
      description: "Enterprise Automation and Lead Ingestion System",
    };
  } catch (e) {
    return {
      title: "Kylas Helper Portal",
      description: "Enterprise Automation and Lead Ingestion System",
    };
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        <NextAuthSessionProvider>
          <Toaster position="bottom-center" />
          <main>{children}</main>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}