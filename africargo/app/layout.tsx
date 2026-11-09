import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AfriCargo — Moving Africa, Digitally.",
  description:
    "AfriCargo is a smart logistics and fleet operations platform connecting your trips, vehicles, drivers, and customers in one place.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
