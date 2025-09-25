'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useApi } from '../../utils/api';
import { PdfProvider, usePdf } from '../../context/PdfContext';

import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import ConfirmModal from '../../components/ConfirmModal';
import AiAssistant from '../../components/AiAssistant';
import DocumentViewer from '../../components/DocumentViewer';

function DashboardContent() {
  const { user, token } = useAuth();
  const {
    loadUserPdfs,
    pdfFiles,
    activeIndex,
    targetPage,
    targetSentence,
    targetChunk,
    pdfToDelete,
    setPdfToDelete,
    selectPdf,
    deletePdf,
    uploadPdf,
    navigateToPage,
  } = usePdf();
  const router = useRouter();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (!user || !token) {
      router.push('/');
    } else {
      loadUserPdfs();
    }
  }, [user, token, router]);

  // const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (!file) return;
  //   await uploadPdf(file);
  // };

  if (!user) return null; // prevent render before auth check

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onUpload={uploadPdf} />
      <div className="grid grid-cols-12 gap-6 p-6">
        <aside className="col-span-2">
          <Sidebar
            activeIndex={activeIndex}
            pdfFiles={pdfFiles}
            onSelect={(idx) => selectPdf(idx)}
            onRequestDelete={(pdf) => {
              setPdfToDelete(pdf);
              setIsDeleteModalOpen(true);
            }}
          />
          <ConfirmModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={deletePdf}
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
            onNavigateToPage={({ page, sentence, filteredChunks }) =>
              navigateToPage(page, sentence, filteredChunks)
            }
            activePdf={activeIndex !== null ? pdfFiles[activeIndex] : null}
          />
        </main>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { apiFetch, listenToStatus } = useApi();
  return (
    <PdfProvider apiFetch={apiFetch} listenToStatus={listenToStatus}>
      <DashboardContent />
    </PdfProvider>
  );
}
