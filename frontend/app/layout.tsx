import "./globals.css";

export const metadata = {
  title: "BhriguWelt",
  description: "Cosmic intelligence for modern seekers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white antialiased">{children}</body>
    </html>
  );
}
