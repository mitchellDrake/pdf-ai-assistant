import { useRouter } from 'next/router';
import { Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header({ onUpload }) {
  const { logout } = useAuth();
  const router = useRouter();

  return (
    <header className="flex items-center justify-between p-6 bg-white shadow">
      <h1 className="text-xl font-bold">PDF AI</h1>
      <div className="flex gap-2">
        <label className="relative flex items-center border rounded-lg px-3 py-2 cursor-pointer bg-blue-600 text-white hover:bg-blue-700 transition">
          <Upload className="w-4 h-4 mr-2" /> Upload PDF
          <input
            type="file"
            accept="application/pdf"
            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
            onChange={onUpload}
          />
        </label>

        <button
          className="px-3 py-2 border rounded-lg text-gray-600 hover:bg-gray-100"
          onClick={() => {
            (logout(), router.push('/'));
          }}
        >
          Logout
        </button>
      </div>
    </header>
  );
}
