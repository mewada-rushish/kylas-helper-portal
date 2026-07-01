import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "Kylas Helper Portal",
  description: "Enterprise Automation and Lead Ingestion System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Toaster position="bottom-center" />
        <main>{children}</main>
      </body>
    </html>
  );
}