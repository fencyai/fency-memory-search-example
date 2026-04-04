import { NextResponse } from 'next/server'

const API_BASE = 'https://api.fency.ai/v1'

const EXPECTED_POKEMON_TAG = 'pokemons-v3'

function getSecretKey(): string {
    const key = process.env.FENCY_SECRET_KEY
    if (!key?.trim()) {
        throw new Error('FENCY_SECRET_KEY is not defined.')
    }
    return key
}

function authHeaders(): HeadersInit {
    return {
        Authorization: `Bearer ${getSecretKey()}`,
        'Content-Type': 'application/json',
    }
}

function extractMemory(payload: unknown): Record<string, unknown> | null {
    if (!payload || typeof payload !== 'object') return null
    const obj = payload as Record<string, unknown>
    const memory = obj.memory
    if (memory && typeof memory === 'object') {
        return memory as Record<string, unknown>
    }
    return obj
}

export async function POST(request: Request) {
    try {
        getSecretKey()
    } catch {
        return NextResponse.json(
            { error: 'Server misconfigured' },
            { status: 500 }
        )
    }

    let body: { memoryId?: string }
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const memoryId = body.memoryId?.trim()
    if (!memoryId) {
        return NextResponse.json({ error: 'memoryId is required' }, { status: 400 })
    }

    const getRes = await fetch(`${API_BASE}/memories/${memoryId}`, {
        method: 'GET',
        headers: authHeaders(),
    })

    const getData: unknown = await getRes.json()

    if (!getRes.ok) {
        return NextResponse.json(getData, { status: getRes.status })
    }

    const memory = extractMemory(getData)
    const metadata = memory?.metadata as Record<string, unknown> | undefined
    if (metadata?.pokemonTag !== EXPECTED_POKEMON_TAG) {
        return NextResponse.json(
            { error: 'Memory is not allowed for download' },
            { status: 403 }
        )
    }

    const postRes = await fetch(
        `${API_BASE}/memories/${memoryId}/download-links`,
        {
            method: 'POST',
            headers: authHeaders(),
            body: '{}',
        }
    )

    const postData: unknown = await postRes.json()

    if (!postRes.ok) {
        return NextResponse.json(postData, { status: postRes.status })
    }

    const downloadLink =
        typeof postData === 'object' &&
        postData !== null &&
        'downloadLink' in postData &&
        typeof (postData as { downloadLink: unknown }).downloadLink ===
            'string'
            ? (postData as { downloadLink: string }).downloadLink
            : null

    if (!downloadLink) {
        return NextResponse.json(
            { error: 'Invalid download link response' },
            { status: 502 }
        )
    }

    return NextResponse.json({ downloadLink })
}
