import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { MuiThemeProvider } from "@/components/MuiThemeProvider";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ReviewMate",
  description:
    "ReviewMate — code quality, security (SAST), and GitHub insights with an AI assistant.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={montserrat.variable}>
        <MuiThemeProvider>{children}</MuiThemeProvider>
      </body>
    </html>
  );
}
