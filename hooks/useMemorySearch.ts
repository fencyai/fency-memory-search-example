import type { AgentTaskModel } from '@fencyai/js'
import type { AgentTask, UseAgentTasksProps } from '@fencyai/react'
import { useAgentTasks } from '@fencyai/react'
import { useState } from 'react'

interface UseMemorySearchProps extends UseAgentTasksProps {
    model: AgentTaskModel
}

interface UseMemorySearch {
    /** Most recent task only; use this so each new search replaces the previous UI. */
    latest: AgentTask | undefined
    isSearching: boolean
    search: (query: string) => Promise<void>
}

export function useMemorySearch({
    model,
    ...agentTasksProps
}: UseMemorySearchProps): UseMemorySearch {
    const { createAgentTask, latest } = useAgentTasks(agentTasksProps)
    const [isSearching, setIsSearching] = useState(false)

    async function search(query: string) {
        const trimmed = query.trim()
        if (!trimmed || isSearching) return

        setIsSearching(true)
        try {
            await createAgentTask({
                type: 'MemorySearch',
                query: trimmed,
                model,
                language: 'en',
                chunkLimit: 5,
                queryExpansion: { queryCount: 3 },
            })
        } catch {
            // Task error is surfaced via task.error
        } finally {
            setIsSearching(false)
        }
    }

    return { latest, isSearching, search }
}
