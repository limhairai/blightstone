"use client";

import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    // Only use Sentry in production
    if (process.env.NODE_ENV === 'production') {
      try {
        const Sentry = require("@sentry/nextjs");
        Sentry.captureException(error);
      } catch (e) {
        console.error('Failed to capture error with Sentry:', e);
      }
    } else {
      // In development, just log to console
      console.error('Global error:', error);
    }
  }, [error]);

  return (
    <html>
      <body>
        {/* `NextError` is the default Next.js error page component. Its type
        definition requires a `statusCode` prop. However, since the App Router
        does not expose status codes for errors, we simply pass 0 to render a
        generic error message. */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}