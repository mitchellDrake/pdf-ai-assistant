import '../styles/globals.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { AuthProvider } from '../context/AuthContext';
import { LoadingProvider } from '../context/LoadingContext';
import LoadingScreen from '../components/LoadingScreen';

export default function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <LoadingProvider>
        <LoadingScreen />
        <Component {...pageProps} />
      </LoadingProvider>
    </AuthProvider>
  );
}
