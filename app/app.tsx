'use client'

import { useMemorySearch } from '@/hooks/useMemorySearch'
import { fetchCreateAgentTaskClientToken } from '@/lib/fetchCreateAgentTaskClientToken'
import {
    AgentTaskProgress,
    type AgentTaskMemoryClickPayload,
} from '@fencyai/react'
import dynamic from 'next/dynamic'
import { useCallback, useState } from 'react'

const PdfViewerModal = dynamic(
    () =>
        import('@/components/PdfViewerModal').then((m) => m.PdfViewerModal),
    { ssr: false }
)

const AVAILABLE_POKEMON_NAMES = [
    'Vulpix',
    'Squirtle',
    'Snorlax',
    'Psyduck',
    'Oddish',
    'Meowth',
    'Jigglypuff',
    'Eevee',
    'Charmander',
    'Bulbasaur',
] as const

export default function App() {
    const [input, setInput] = useState('')
    const [pdfModal, setPdfModal] = useState<{
        downloadLink: string
        initialPage: number
    } | null>(null)
    const [pdfLoading, setPdfLoading] = useState(false)
    const [pdfFetchError, setPdfFetchError] = useState<string | null>(null)

    const { latest, isSearching, search } = useMemorySearch({
        fetchCreateAgentTaskClientToken,
        model: "anthropic/claude-opus-4.6",
    })

    const task =
        latest?.params.type === 'MemorySearch' ? latest : undefined

    const handleSearchResultClick = useCallback(
        async ({ memoryId, pageNumbers }: AgentTaskMemoryClickPayload) => {
            if (pdfLoading) return
            setPdfFetchError(null)
            setPdfLoading(true)
            try {
                const res = await fetch('/api/memory-download-link', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ memoryId }),
                })
                const data = (await res.json()) as {
                    downloadLink?: string
                    error?: string
                }
                if (!res.ok) {
                    setPdfFetchError(
                        data.error ?? `Request failed (${res.status})`
                    )
                    return
                }
                if (!data.downloadLink) {
                    setPdfFetchError('No download link returned')
                    return
                }
                const firstPage =
                    pageNumbers.length > 0 ? pageNumbers[0]! : 1
                setPdfModal({
                    downloadLink: data.downloadLink,
                    initialPage: firstPage,
                })
            } catch {
                setPdfFetchError('Failed to fetch download link')
            } finally {
                setPdfLoading(false)
            }
        },
        [pdfLoading]
    )

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!input.trim() || isSearching) return
        const text = input
        setInput('')
        await search(text)
    }

    return (
        <div className="mx-auto flex h-screen max-w-5xl flex-col">
            <div className="shrink-0 space-y-4 border-b border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                <div className="flex flex-col items-center text-center">
                    <p className="max-w-xl text-sm text-neutral-600 dark:text-neutral-400">
                        This example uses Memory Search to find content in Pokemon
                        memories. The available pokemons are:{' '}
                        {AVAILABLE_POKEMON_NAMES.join(', ')}. Submit a query to see
                        ranked chunks and progress.
                    </p>
                </div>
                <form
                    onSubmit={handleSubmit}
                    className="flex gap-2"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="e.g. What type is Charmander?"
                        disabled={isSearching}
                        className="min-w-0 flex-1 rounded border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-neutral-500 dark:border-neutral-600 dark:focus:border-neutral-400"
                    />
                    <button
                        type="submit"
                        disabled={isSearching || !input.trim()}
                        className="rounded border border-neutral-300 bg-neutral-100 px-4 py-2 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-800"
                    >
                        Submit
                    </button>
                </form>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {task && task.params.type === 'MemorySearch' ? (
                    <div key={task.taskKey} className="mb-4">
                        <div className="mb-2 ml-auto w-fit max-w-[80%] rounded-lg bg-blue-500 px-3 py-2 text-right text-white dark:bg-blue-800">
                            {task.params.query}
                        </div>
                        <div className="mb-2 mr-auto max-w-[80%]">
                            {task.error ? (
                                <div className="rounded-lg bg-red-50 px-3 py-2 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                                    {task.error.message}
                                </div>
                            ) : (
                                <>
                                    {pdfFetchError ? (
                                        <div className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                                            {pdfFetchError}
                                        </div>
                                    ) : null}
                                    {pdfLoading ? (
                                        <p className="mb-2 text-sm text-neutral-500">
                                            Opening PDF...
                                        </p>
                                    ) : null}
                                    <AgentTaskProgress
                                        agentTask={task}
                                        onSearchResultClick={
                                            handleSearchResultClick
                                        }
                                    />
                                </>
                            )}
                        </div>
                    </div>
                ) : null}
            </div>

            {pdfModal ? (
                <PdfViewerModal
                    downloadLink={pdfModal.downloadLink}
                    initialPage={pdfModal.initialPage}
                    onClose={() => setPdfModal(null)}
                />
            ) : null}
        </div>
    )
}
