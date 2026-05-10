import React, { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url).href;

const PdfViewer = ({ file }) => {
  const containerRef = useRef(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!file) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setPages([]);
    const loadPdf = async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        if (cancelled) return;
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
        if (cancelled) return;
        const container = containerRef.current;
        const maxWidth = container
          ? container.clientWidth - 48
          : Math.min(window.innerWidth - 80, 700);

        // Render all pages
        const renderedPages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
        if (cancelled) return;
          const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1 });
          // Use higher scale — up to 2.5x for HiDPI clarity
          const scale = Math.min(maxWidth / viewport.width, 2.5);
        const scaledViewport = page.getViewport({ scale });

          // Create canvas for this page
          const canvas = document.createElement('canvas');
        const dpr = window.devicePixelRatio || 1;
        canvas.width = scaledViewport.width * dpr;
        canvas.height = scaledViewport.height * dpr;
        canvas.style.width = `${scaledViewport.width}px`;
        canvas.style.height = `${scaledViewport.height}px`;
          canvas.className = 'pdf-canvas';

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, scaledViewport.width, scaledViewport.height);
        await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;

          renderedPages.push({ canvas, pageNum: i, key: `page-${i}` });
        }

        if (!cancelled) {
          setPages(renderedPages);
        setLoading(false);
        }
      } catch (err) {
        console.error('PDF.js load error:', err);
        setError(err.message || 'Failed to load PDF');
        setLoading(false);
      }
    };

    loadPdf();
    return () => { cancelled = true; };
  }, [file]);

  // Append canvases to container
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    // Remove old canvases (keep children that aren't canvases like nav, spinners)
    const oldCanvases = container.querySelectorAll('.pdf-canvas');
    oldCanvases.forEach(el => el.remove());

    // Append new canvases
    pages.forEach(p => container.appendChild(p.canvas));
  }, [pages]);
  if (error) {
    const fallbackUrl = URL.createObjectURL(file);
    return (
      <div className="pdf-custom-viewer" ref={containerRef}>
        <object
          data={fallbackUrl}
          type="application/pdf"
          style={{ width: '100%', flex: 1, minHeight: 500, border: 'none' }}
        >
          <p>Unable to display PDF.</p>
        </object>
      </div>
    );
  }

  return (
    <div className="pdf-custom-viewer scrollable" ref={containerRef}>
      {loading && (
        <div className="pdf-loading-wrapper">
          <div className="pdf-loading-spinner" />
          <span className="pdf-loading-text">Loading PDF...</span>
        </div>
      )}
      {!loading && pages.length === 0 && !error && (
        <div className="pdf-empty">No pages to display.</div>
      )}
      </div>
  );
};

export default PdfViewer;

