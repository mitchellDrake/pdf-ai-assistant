'use client';
interface PDFFile {
  id: string;
  fileName: string;
  fileUrl: string;
}

interface PDFChunk {
  text: string;
  // add any other fields you use in targetChunk
}

interface DocumentViewerProps {
  file: string | null;
  targetPage: number | null;
  targetSentence: string;
  targetChunk: PDFChunk[]; // or any[] if you don’t have a type
}

import { ComponentType, useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLoading } from '../../context/LoadingContext';
import { useRouter } from 'next/navigation'; // ✅ App Router
import { useApi } from '../../utils/api';

import dynamic from 'next/dynamic';

import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import ConfirmModal from '../../components/ConfirmModal';
import AiAssistant from '../../components/AiAssistant';
import DocumentViewer from '../../components/DocumentViewer';

// const DocumentViewer = dynamic<React.FC<DocumentViewerProps>>(
//   async () => {
//     const mod = await import('../../components/DocumentViewer');
//     return mod.default as React.FC<DocumentViewerProps>;
//   },
//   { ssr: false }
// );

export default function DashboardPage() {
  const { user, token } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const router = useRouter();
  const { apiFetch, listenToStatus } = useApi();

  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [targetPage, setTargetPage] = useState<number | null>(null);
  const [targetSentence, setTargetSentence] = useState('');
  const [targetChunk, setTargetChunk] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pdfToDelete, setPdfToDelete] = useState<any>(null);

  useEffect(() => {
    if (!user || !token) {
      router.push('/');
    } else {
      loadPDFs();
    }
  }, [user, token, router]);

  async function loadPDFs() {
    try {
      showLoading('Loading PDFs...');
      const { pdfs = [] } = await apiFetch('/pdf/list');
      setPdfFiles(pdfs);
      hideLoading();
    } catch (err) {
      hideLoading();
      console.error('Failed to load PDFs', err);
    }
  }

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    showLoading(`Uploading ${file.name}...`);
    try {
      const data = await apiFetch(
        '/pdf/upload',
        { method: 'POST', body: formData },
        true
      );
      const success = listenToStatus(data.pdf.id, (status) => {
        showLoading(`${status}`);
        if (status === 'done' || status === 'failed') {
          loadPDFs();
          success();
        }
      });
    } catch (err) {
      hideLoading();
      console.error('Upload failed:', err);
    }
  };

  const handleNavigate = ({ page, sentence, filteredChunks }: any) => {
    setTargetPage(page);
    setTargetSentence(sentence);
    setTargetChunk(filteredChunks);
  };

  const handleSelect = async (index: number) => {
    setActiveIndex(index);
    setTargetPage(null);
    setTargetSentence('');
    const selectedPdf = pdfFiles[index];
    if (!selectedPdf) return;

    try {
      await apiFetch(`/pdf/i/${selectedPdf.id}`);
    } catch (error) {
      console.error('Failed to fetch PDF chunks', error);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pdfToDelete) return;
    try {
      showLoading(`Deleting ${pdfToDelete.fileName}...`);
      setActiveIndex(null);
      await apiFetch(`/pdf/i/${pdfToDelete.id}`, { method: 'DELETE' });
      hideLoading();
      loadPDFs();
    } catch (error) {
      console.error(error);
    }
  };

  if (!user) return null; // prevent render before auth check

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
            file={activeIndex !== null ? pdfFiles[activeIndex]?.fileUrl : null}
            targetPage={targetPage ?? null}
            targetSentence={targetSentence ?? ''}
            targetChunk={targetChunk ?? []}
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
