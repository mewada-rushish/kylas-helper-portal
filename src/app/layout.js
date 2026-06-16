import "./globals.css";

export const metadata = {
  title: "Kylas Helper Portal",
  description: "Enterprise Automation and Lead Ingestion System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}