// context/PdfContext.tsx
'use client';
import { createContext, useContext, useState } from 'react';
import { useLoading } from './LoadingContext';

interface PDFFile {
  id: string;
  fileName: string;
  fileUrl: string;
}

interface PdfProviderProps {
  children: React.ReactNode;
  apiFetch: any;
  listenToStatus?: (
    pdfId: string,
    callback: (status: string) => void
  ) => void | (() => void);
}

interface PdfContextType {
  pdfFiles: PDFFile[];
  setPdfFiles: (files: PDFFile[]) => void;
  activeIndex: number | null;
  setActiveIndex: (index: number | null) => void;
  targetPage: number | null;
  setTargetPage: (page: number | null) => void;
  targetSentence: string;
  setTargetSentence: (s: string) => void;
  targetChunk: any;
  setTargetChunk: (c: any) => void;
  pdfToDelete: PDFFile | null; // ← add this
  setPdfToDelete: (pdf: PDFFile | null) => void; // ← add setter
  loadUserPdfs: () => Promise<boolean>;
  selectPdf: (index: number) => Promise<void>;
  deletePdf: () => Promise<void>;
  uploadPdf: (file: File | undefined) => Promise<void>;
  navigateToPage: (
    page: number | null,
    sentence: any,
    filteredChunks: any
  ) => void;
}

const PdfContext = createContext<PdfContextType | undefined>(undefined);

export function PdfProvider({
  children,
  apiFetch,
  listenToStatus,
}: PdfProviderProps) {
  const { showLoading, hideLoading } = useLoading();

  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [targetPage, setTargetPage] = useState<number | null>(null);
  const [targetSentence, setTargetSentence] = useState('');
  const [targetChunk, setTargetChunk] = useState<any>(null);
  const [pdfToDelete, setPdfToDelete] = useState<PDFFile | null>(null);

  async function loadUserPdfs() {
    try {
      showLoading('Loading PDFs...');
      const { pdfs = [] } = await apiFetch('/pdf/list');
      setPdfFiles(pdfs);
      setActiveIndex((prev) =>
        prev ? prev + 1 : pdfs.length === 0 ? null : 1
      );
      hideLoading();
      return true;
    } catch (error) {
      console.log('error in loadPDF', error);
      hideLoading();
      return false;
    }
  }

  async function selectPdf(index: number) {
    try {
      setActiveIndex(index);
      setTargetPage(null);
      setTargetSentence('');
      const selectedPdf = pdfFiles[index];

      if (!selectedPdf) return;
      await apiFetch(`/pdf/i/${selectedPdf.id}`);
    } catch (error) {
      console.log('error in selectPdf', error);
      return;
    }
  }

  async function deletePdf() {
    if (!pdfToDelete) return;

    setActiveIndex(null);
    showLoading(`Deleting ${pdfToDelete.fileName}...`);

    try {
      await apiFetch(`/pdf/i/${pdfToDelete.id}`, { method: 'DELETE' });
      await loadUserPdfs(); // reload PDF list
    } catch (error) {
      console.error('Error deleting PDF:', error);
    } finally {
      hideLoading();
    }
  }

  // context/PdfContext.tsx
  async function uploadPdf(file?: File) {
    if (!file) return;
    try {
      showLoading?.(`Uploading ${file.name}...`);

      const formData = new FormData();
      formData.append('file', file);

      const data = await apiFetch(
        '/pdf/upload',
        { method: 'POST', body: formData },
        true
      );

      // Listen for completion status
      if (listenToStatus) {
        const stopListening = listenToStatus(data.pdf.id, (status) => {
          if (status === 'done' || status === 'failed') {
            loadUserPdfs(); // reload PDF list
            stopListening?.();
          }
        });
      }

      hideLoading?.();
    } catch (err) {
      hideLoading?.();
      console.error('Upload failed', err);
    }
  }

  function navigateToPage(
    page: number | null,
    sentence: any,
    filteredChunks: any
  ) {
    console.log('navigate to page', page, sentence, filteredChunks);
    setTargetPage(page);
    setTargetSentence(sentence);
    setTargetChunk(filteredChunks);
  }

  return (
    <PdfContext.Provider
      value={{
        pdfFiles,
        setPdfFiles,
        activeIndex,
        setActiveIndex,
        targetPage,
        setTargetPage,
        targetSentence,
        setTargetSentence,
        targetChunk,
        setTargetChunk,
        pdfToDelete,
        setPdfToDelete,
        loadUserPdfs,
        selectPdf,
        deletePdf,
        uploadPdf,
        navigateToPage,
      }}
    >
      {children}
    </PdfContext.Provider>
  );
}

export function usePdf() {
  const context = useContext(PdfContext);
  if (!context) throw new Error('usePdf must be used within PdfProvider');
  return context;
}
