import '@/app/ui/global.css';
import {inter} from '@/app/ui/fonts';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | ACME Dashboard',
    default: 'ACME Dashboard'
  },
  description: "The official dashboard app built with NextJS App Router",
  metadataBase: new URL("https://nextjs-dashboard-delta-six-95.vercel.app")
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
