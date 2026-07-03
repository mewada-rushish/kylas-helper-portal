import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import NextAuthSessionProvider from "@/components/providers/session-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Kylas Helper Portal",
  description: "Enterprise Automation and Lead Ingestion System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthSessionProvider>
          <Toaster position="bottom-center" />
          <main>{children}</main>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}