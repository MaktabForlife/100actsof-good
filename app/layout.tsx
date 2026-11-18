import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The 100 Acts of Good · Umm Abbad Academy",
  description: "Every act is a drop. Every drop sends out a ripple. A team logbook for living our Ilm through nurturing the Ummah.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
