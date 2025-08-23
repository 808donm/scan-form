import Script from 'next/script';

export const metadata = { title: 'External Scan Request' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Cloudflare Turnstile script */}
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <div className="mx-auto max-w-2xl p-6">{children}</div>
      </body>
    </html>
  );
}