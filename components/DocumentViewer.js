'use client';
import { useState, useEffect, useRef } from 'react';
import { matchText } from '../utils/highlightText';

export default function DocumentViewer({
  file = false,
  targetPage = false,
  targetSentence = false,
  targetChunk = false,
}) {
  const [pdfLib, setPdfLib] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [highlights, setHighlights] = useState([]);
  const canvasRefs = useRef([]);
  const containerRef = useRef(null);

  // Dynamic import
  useEffect(() => {
    const loadPdfjs = async () => {
      const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
      await import('pdfjs-dist/build/pdf.worker.mjs'); // worker
      setPdfLib(pdfjsLib);
    };
    loadPdfjs();
  }, []);

  useEffect(() => {
    if (
      !pdfLib ||
      !pdfDoc ||
      !targetPage ||
      !targetSentence ||
      !targetChunk ||
      targetChunk.length === 0
    )
      return;

    const highlightTarget = async () => {
      const pageNum = Math.min(Math.max(1, targetPage), pdfDoc.numPages);
      const page = await pdfDoc.getPage(pageNum);

      // Scroll to the page
      goToPage(pageNum);

      // Get text items for the page
      const textContent = await page.getTextContent();
      const containerWidth = containerRef.current.offsetWidth;
      const unscaledViewport = page.getViewport({ scale: 1 });
      const scale = containerWidth / unscaledViewport.width;
      const viewport = page.getViewport({ scale });
      const newHighlights = matchText(
        targetChunk[0].text,
        textContent,
        pageNum,
        viewport,
        scale
      );
      setHighlights(newHighlights);
    };

    highlightTarget();
  }, [targetPage, targetSentence, targetChunk, pdfDoc, pdfLib]);

  // Load and render PDF
  useEffect(() => {
    if (!pdfLib || !file || !containerRef.current) return;

    const loadPdf = async () => {
      const pdf = await pdfLib.getDocument(file).promise;
      setPdfDoc(pdf);
      setCurrentPage(1);
      setHighlights([]);
      containerRef.current.scrollTo({ top: 0, behavior: 'auto' });
      const containerWidth = containerRef.current.offsetWidth;

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);

        const unscaledViewport = page.getViewport({ scale: 1 });
        const scale = containerWidth / unscaledViewport.width;
        const viewport = page.getViewport({ scale });
        let canvas;
        while (!(canvas = canvasRefs.current[pageNum - 1])) {
          await new Promise((res) => requestAnimationFrame(res));
        }
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;
      }
    };

    loadPdf();
  }, [pdfLib, file]);

  // Scroll listener to update current page
  useEffect(() => {
    if (!containerRef.current || !pdfDoc) return;

    const handleScroll = () => {
      const containerRect = containerRef.current.getBoundingClientRect();
      let closestPage = 1;
      let minDistance = Infinity;

      canvasRefs.current.forEach((canvas, index) => {
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const canvasCenter = rect.top + rect.height / 2;
        const containerCenter = containerRect.top + containerRect.height / 2;
        const distance = Math.abs(canvasCenter - containerCenter);

        if (distance < minDistance) {
          minDistance = distance;
          closestPage = index + 1;
        }
      });

      setCurrentPage(closestPage);
    };

    const container = containerRef.current;
    container.addEventListener('scroll', handleScroll);

    return () => container.removeEventListener('scroll', handleScroll);
  }, [pdfDoc]);

  const goToPage = (pageNum) => {
    const canvas = canvasRefs.current[pageNum - 1];
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Get the canvas top relative to container
    const containerRect = container.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const scrollTop =
      container.scrollTop + (canvasRect.top - containerRect.top);

    container.scrollTo({
      top: scrollTop,
      behavior: 'smooth',
    });

    setCurrentPage(pageNum);
  };

  if (!file) {
    return (
      <div className="bg-white p-4 rounded-lg shadow h-[80vh] flex items-center justify-center text-gray-400">
        Upload a PDF to preview it
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow h-[80vh] flex flex-col">
      {/* Fixed header with pagination */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <h2 className="font-semibold text-lg">Document Viewer</h2>
        <div className="flex items-center space-x-2">
          <span>
            <input
              type="number"
              min={1}
              max={pdfDoc?.numPages || 1}
              value={currentPage}
              onChange={(e) => {
                const pageNum = Math.min(
                  Math.max(1, parseInt(e.target.value) || 1),
                  pdfDoc.numPages
                );
                goToPage(pageNum);
              }}
              className="w-12 text-center border rounded"
            />{' '}
            / {pdfDoc?.numPages || 1}
          </span>
          <button
            onClick={() => goToPage(Math.max(1, currentPage - 1))}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Prev
          </button>
          <button
            onClick={() => goToPage(Math.min(pdfDoc.numPages, currentPage + 1))}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Next
          </button>
        </div>
      </div>

      {/* Scrollable PDF content */}
      <div
        className="flex-1 overflow-auto pr-2"
        ref={containerRef}
        style={{ scrollBehavior: 'smooth' }}
      >
        {pdfDoc &&
          Array.from({ length: pdfDoc.numPages }, (_, index) => (
            <div
              key={`page_${index + 1}`}
              className="page-container relative mb-4 flex justify-center"
            >
              {/* The rendered PDF page */}
              <canvas
                ref={(el) => (canvasRefs.current[index] = el)}
                style={{ maxWidth: '100%', height: 'auto' }}
              />

              {/* Highlight overlay */}
              <div
                className="absolute top-0 left-0 pointer-events-none"
                style={{
                  width: canvasRefs.current[index]?.width || 0,
                  height: canvasRefs.current[index]?.height || 0,
                }}
              >
                {highlights
                  .filter((h) => h.page === index + 1)
                  .map((h, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: 'absolute',
                        left: `${h.x}px`,
                        top: `${h.y}px`,
                        width: `${h.width}px`,
                        height: `${h.height}px`,
                        backgroundColor: 'yellow',
                        opacity: 0.4,
                      }}
                    />
                  ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
