'use client';
import { useLoading } from '../context/LoadingContext';

export default function LoadingScreen() {
  const { isLoading, loadingMessage } = useLoading();

  if (!isLoading) return null;

  return (
    <div style={overlayStyle}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={spinnerStyle}></div>
        {loadingMessage && (
          <p style={{ marginTop: '1rem', color: 'white', fontSize: '1rem' }}>
            {loadingMessage}
          </p>
        )}
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
};

const spinnerStyle = {
  width: '60px',
  height: '60px',
  border: '6px solid #f3f3f3',
  borderTop: '6px solid #3498db',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};
