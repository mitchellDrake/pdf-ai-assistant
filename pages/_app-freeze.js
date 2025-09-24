import '../styles/globals.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Analytics } from '@vercel/analytics/next';
import { AuthProvider } from '../context/AuthContext';
import { LoadingProvider } from '../context/LoadingContext';
import LoadingScreen from '../components/LoadingScreen';
import { useEffect, useState } from 'react';

function DesktopOnly({ children }) {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024); // Tailwind `lg` breakpoint
    };

    handleResize(); // run once on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isDesktop) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <h1 className="text-xl font-semibold text-center">
          This app is only available on desktop. Please switch to a larger
          screen 💻
        </h1>
      </div>
    );
  } else {
    return <>{children}</>;
  }
}

export default function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <LoadingProvider>
        <LoadingScreen />
        <DesktopOnly>
          <Component {...pageProps} />
          <Analytics />
        </DesktopOnly>
      </LoadingProvider>
    </AuthProvider>
  );
}
