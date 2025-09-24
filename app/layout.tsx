import './globals.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from '../context/AuthContext';
import { LoadingProvider } from '../context/LoadingContext';
import LoadingScreen from '../components/LoadingScreen';
import DesktopOnly from '../components/DesktopOnly'; // we'll move this out
import type { Metadata } from 'next';

// SEO metadata (replaces Head in _document.tsx/_app.tsx)
export const metadata: Metadata = {
  title: 'PDF AI Assistant',
  description: 'Read and Annotate PDFs with AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <LoadingProvider>
            <LoadingScreen />
            <DesktopOnly>
              {children}
              <Analytics />
            </DesktopOnly>
          </LoadingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
