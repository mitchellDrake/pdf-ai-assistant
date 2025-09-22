import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';
import { useRouter } from 'next/router';
import { useApi } from '../utils/api';

import dynamic from 'next/dynamic';

import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import ConfirmModal from '../components/ConfirmModal';

const DocumentViewer = dynamic(() => import('../components/DocumentViewer'), {
  ssr: false,
});

import AiAssistant from '../components/AiAssistant';

export default function Dashboard() {
  const { user, token } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const router = useRouter();
  const apiFetch = useApi();

  useEffect(() => {
    if (!user || !token) {
      console.log('no user found');
      router.push('/');
    } else {
      loadPDFs(); // fetch PDFs on component mount
    }
  }, []);

  const [pdfFiles, setPdfFiles] = useState([]); // original File objects
  const [activeIndex, setActiveIndex] = useState(null); // index of the active PDF
  const [targetPage, setTargetPage] = useState(null);
  const [targetSentence, setTargetSentence] = useState('');
  const [targetChunk, setTargetChunk] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pdfToDelete, setPdfToDelete] = useState(null);

  async function loadPDFs() {
    try {
      showLoading('Loading PDFs...');
      const { pdfs } = await apiFetch('/pdf/list');
      setPdfFiles(pdfs);
      hideLoading();
    } catch (err) {
      hideLoading();
      console.error('Failed to load PDFs', err);
    }
  }

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    showLoading('Processing file, this could take a few seconds...');
    try {
      const data = await apiFetch(
        '/pdf/upload',
        {
          method: 'POST',
          body: formData,
        },
        true
      ); // `true` for FormData so Content-Type isn't overridden

      console.log('Upload response:', data);
      loadPDFs();
      hideLoading();
    } catch (err) {
      hideLoading();
      console.error('Upload failed:', err);
    }
  };

  const handleNavigate = ({ page, sentence, filteredChunks }) => {
    setTargetPage(page);
    setTargetSentence(sentence);
    setTargetChunk(filteredChunks);
  };

  const handleSelect = async (index) => {
    setActiveIndex(index);
    setTargetPage(null);
    setTargetSentence('');
    const selectedPdf = pdfFiles[index];
    if (!selectedPdf) return;
    let pdfString = `/pdf/i/${selectedPdf.id}`;

    try {
      const data = await apiFetch(`/pdf/i/${selectedPdf.id}`);
    } catch (error) {
      console.error('Failed to fetch PDF chunks', error);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      showLoading(`Deleting ${pdfToDelete.fileName}...`);
      setActiveIndex(null);
      console.log('pdfToDelete', pdfToDelete);
      await apiFetch(`/pdf/i/${pdfToDelete.id}`, {
        method: 'DELETE',
      });
      hideLoading();
      loadPDFs();
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {}, []);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onUpload={handleUpload} />
      <div className="grid grid-cols-12 gap-6 p-6">
        <aside className="col-span-2">
          <Sidebar
            activeIndex={activeIndex}
            pdfFiles={pdfFiles}
            onSelect={handleSelect}
            onRequestDelete={(pdf) => {
              setPdfToDelete(pdf);
              setIsDeleteModalOpen(true);
            }}
          />
          <ConfirmModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleConfirmDelete}
            title="Delete PDF"
            description={`Are you sure you want to delete "${pdfToDelete?.fileName}"? This action cannot be undone.`}
          />
        </aside>
        <main className="col-span-6 space-y-6">
          <DocumentViewer
            file={activeIndex !== null ? pdfFiles[activeIndex].fileUrl : null}
            targetPage={targetPage}
            targetSentence={targetSentence}
            targetChunk={targetChunk}
          />
        </main>
        <main className="col-span-4 space-y-6">
          <AiAssistant
            onNavigateToPage={handleNavigate}
            activePdf={activeIndex !== null ? pdfFiles[activeIndex] : null}
          />
        </main>
      </div>
    </div>
  );
}
