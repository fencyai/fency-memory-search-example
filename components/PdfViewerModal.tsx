'use client'

import { useCallback, useEffect, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export type PdfViewerModalProps = {
    downloadLink: string
    /** 1-based page index (first page in the search hit). */
    initialPage: number
    onClose: () => void
}

export function PdfViewerModal({
    downloadLink,
    initialPage,
    onClose,
}: PdfViewerModalProps) {
    const [numPages, setNumPages] = useState<number | null>(null)
    const [pageNumber, setPageNumber] = useState(() =>
        Math.max(1, Math.floor(initialPage))
    )
    const [loadError, setLoadError] = useState<string | null>(null)

    useEffect(() => {
        setPageNumber(Math.max(1, Math.floor(initialPage)))
    }, [initialPage])

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [onClose])

    const onDocumentLoadSuccess = useCallback(
        ({ numPages: n }: { numPages: number }) => {
            setNumPages(n)
            setLoadError(null)
            setPageNumber((p) => Math.min(Math.max(1, p), n))
        },
        []
    )

    const onDocumentLoadError = useCallback((err: Error) => {
        setLoadError(err.message)
        setNumPages(null)
    }, [])

    const goPrev = useCallback(() => {
        setPageNumber((p) => Math.max(1, p - 1))
    }, [])

    const goNext = useCallback(() => {
        setPageNumber((p) => (numPages ? Math.min(numPages, p + 1) : p))
    }, [numPages])

    const file = downloadLink

    const [pageWidth, setPageWidth] = useState(720)
    useEffect(() => {
        function updateWidth() {
            setPageWidth(Math.min(720, Math.max(240, window.innerWidth - 80)))
        }
        updateWidth()
        window.addEventListener('resize', updateWidth)
        return () => window.removeEventListener('resize', updateWidth)
    }, [])

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="PDF viewer"
            onClick={onClose}
        >
            <div
                className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex shrink-0 items-center justify-between gap-2 border-b border-neutral-200 px-3 py-2 dark:border-neutral-700">
                    <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-200">
                        <span>
                            Page{' '}
                            {numPages ? (
                                <>
                                    {pageNumber} / {numPages}
                                </>
                            ) : (
                                '...'
                            )}
                        </span>
                        <button
                            type="button"
                            onClick={goPrev}
                            disabled={!numPages || pageNumber <= 1}
                            className="rounded border border-neutral-300 px-2 py-1 text-xs disabled:opacity-40 dark:border-neutral-600"
                        >
                            Previous
                        </button>
                        <button
                            type="button"
                            onClick={goNext}
                            disabled={
                                !numPages || pageNumber >= (numPages ?? 0)
                            }
                            className="rounded border border-neutral-300 px-2 py-1 text-xs disabled:opacity-40 dark:border-neutral-600"
                        >
                            Next
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded border border-neutral-300 px-3 py-1 text-sm dark:border-neutral-600"
                    >
                        Close
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                    {loadError ? (
                        <p className="text-sm text-red-600 dark:text-red-400">
                            {loadError}
                        </p>
                    ) : (
                        <div className="flex justify-center">
                            <Document
                                file={file}
                                onLoadSuccess={onDocumentLoadSuccess}
                                onLoadError={onDocumentLoadError}
                                loading={
                                    <p className="text-sm text-neutral-500">
                                        Loading PDF...
                                    </p>
                                }
                            >
                                <Page
                                    pageNumber={pageNumber}
                                    width={pageWidth}
                                    renderTextLayer
                                    renderAnnotationLayer
                                />
                            </Document>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
