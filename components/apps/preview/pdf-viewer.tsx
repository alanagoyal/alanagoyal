"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { getPdfProxyUrl } from "@/lib/preview-utils";

interface PdfViewerProps {
  fileUrl: string;
  fileName: string;
  focusOverlayActive?: boolean;
  onRequestFocus?: () => void;
  errorContentClassName?: string;
}

export function PdfViewer({
  fileUrl,
  fileName,
  focusOverlayActive = false,
  onRequestFocus,
  errorContentClassName,
}: PdfViewerProps) {
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState(false);
  const [pdfAttempt, setPdfAttempt] = useState(0);

  const pdfProxyUrl = useMemo(() => getPdfProxyUrl(fileUrl), [fileUrl]);
  const pdfSrc = useMemo(() => `${pdfProxyUrl}&attempt=${pdfAttempt}`, [pdfProxyUrl, pdfAttempt]);

  useEffect(() => {
    setPdfLoading(true);
    setPdfError(false);
    setPdfAttempt(0);
  }, [fileUrl]);

  // Timeout for PDF loading - if it takes too long, show error with download link
  useEffect(() => {
    if (!pdfLoading || pdfError) return;

    const timeoutId = setTimeout(() => {
      if (pdfLoading) {
        setPdfError(true);
        setPdfLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeoutId);
  }, [pdfLoading, pdfError, pdfAttempt, fileUrl]);

  if (pdfError) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 dark:text-zinc-400">
        <div className={cn("text-center", errorContentClassName)}>
          <svg className="w-16 h-16 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          <p className="font-medium">Unable to display PDF</p>
          <p className="text-sm mt-1 mb-3">The PDF viewer couldn&apos;t load this file</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => {
                setPdfError(false);
                setPdfLoading(true);
                setPdfAttempt((attempt) => attempt + 1);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
            >
              Retry
            </button>
            <a
              href={pdfProxyUrl}
              download={fileName}
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download PDF
            </a>
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 transition-colors"
            >
              Open Original
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {focusOverlayActive && onRequestFocus && (
        <div
          className="absolute inset-0 z-10"
          onMouseDown={(event) => {
            event.preventDefault();
            onRequestFocus();
          }}
          onClick={(event) => {
            event.preventDefault();
            onRequestFocus();
          }}
        />
      )}
      {pdfLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
          <div className="flex flex-col items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
            </svg>
            <span className="text-sm">Loading PDF...</span>
          </div>
        </div>
      )}
      <iframe
        key={pdfSrc}
        src={pdfSrc}
        className="w-full h-full border-0"
        title={fileName}
        tabIndex={0}
        onFocus={onRequestFocus ? () => onRequestFocus() : undefined}
        onLoad={() => {
          setPdfLoading(false);
          setPdfError(false);
        }}
        onError={() => {
          setPdfLoading(false);
          setPdfError(true);
        }}
      />
    </div>
  );
}
