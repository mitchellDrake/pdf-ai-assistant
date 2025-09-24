'use client';

import { useEffect, useState } from 'react';

export default function DesktopOnly({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
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
  }

  return <>{children}</>;
}
