export interface RawOpportunity {
  readonly externalId?: string
  readonly source: 'url-fetch' | 'greenhouse' | 'lever' | 'ashby' | 'manual'
  readonly url: string
  readonly title: string
  readonly company?: string
  readonly location?: string
  readonly publishedAt?: string
  readonly description: string
}

export type OpportunityUserDecision = 'new' | 'seen' | 'interested' | 'applied' | 'dismissed'

export interface ProcessedOpportunity {
  readonly id: string
  readonly raw: RawOpportunity
  readonly evaluation: import('./opportunity.js').OpportunityEvaluation
  readonly userDecision: OpportunityUserDecision
  readonly userFeedbackReason?: string
  readonly createdAt: string
  readonly updatedAt: string
}

export function hashOpportunityKey(raw: RawOpportunity): string {
  if (raw.externalId && raw.company) {
    return `opp-${raw.company.toLowerCase().replace(/[^a-z0-9]/g, '')}-${raw.externalId}`
  }
  const cleanUrl = raw.url.split('?')[0]!.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')
  return `opp-hash-${cleanUrl.replace(/[^a-z0-9]/g, '_')}`
}

export interface OpportunitySourceInput {
  readonly url: string
}

export interface OpportunitySource {
  fetch(input: OpportunitySourceInput): Promise<RawOpportunity>
}

// ---- SSRF Protection Guard --------------------------------------------------

export interface SafeFetchOptions {
  readonly maxRedirects?: number
  readonly maxSizeBytes?: number
  readonly timeoutMs?: number
}

const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/, // Link-local / Cloud metadata API
  /^::1$/,
  /^fe80:/i,
]

export function validateSafeUrl(urlStr: string): URL {
  let parsed: URL
  try {
    parsed = new URL(urlStr)
  } catch {
    throw new Error(`Invalid URL format: "${urlStr}"`)
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Forbidden protocol: "${parsed.protocol}". Only http and https are allowed.`)
  }

  const hostname = parsed.hostname
  if (PRIVATE_IP_PATTERNS.some(pattern => pattern.test(hostname))) {
    throw new Error(`Security Violation (SSRF): Access to private/internal network host "${hostname}" is forbidden.`)
  }

  return parsed
}

export async function fetchSafeContent(urlStr: string, options: SafeFetchOptions = {}): Promise<{ finalUrl: string; html: string }> {
  const targetUrl = validateSafeUrl(urlStr)
  const maxSizeBytes = options.maxSizeBytes ?? 2 * 1024 * 1024 // 2MB
  const timeoutMs = options.timeoutMs ?? 10000 // 10s

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(targetUrl.href, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Provena/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText} fetching URL "${urlStr}"`)
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml') && !contentType.includes('text/plain') && !contentType.includes('json')) {
      throw new Error(`Unsupported content type "${contentType}". Expected HTML/text.`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      const text = await response.text()
      return { finalUrl: response.url || targetUrl.href, html: text }
    }

    let receivedBytes = 0
    const chunks: Uint8Array[] = []

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) {
        receivedBytes += value.length
        if (receivedBytes > maxSizeBytes) {
          controller.abort()
          throw new Error(`Response size limit exceeded (${maxSizeBytes} bytes).`)
        }
        chunks.push(value)
      }
    }

    const totalBuffer = new Uint8Array(receivedBytes)
    let offset = 0
    for (const chunk of chunks) {
      totalBuffer.set(chunk, offset)
      offset += chunk.length
    }

    const decoder = new TextDecoder('utf-8')
    const html = decoder.decode(totalBuffer)
    return { finalUrl: response.url || targetUrl.href, html }
  } finally {
    clearTimeout(timer)
  }
}

// ---- Document Extractor (JSON-LD + OpenGraph + Clean HTML Fallback) -----------

export function extractJobFromHtml(url: string, html: string): RawOpportunity {
  // Strategy 1: JSON-LD schema.org/JobPosting
  const jsonLdMatches = html.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  if (jsonLdMatches) {
    for (const tag of jsonLdMatches) {
      const contentMatch = tag.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)
      if (contentMatch && contentMatch[1]) {
        try {
          const parsed = JSON.parse(contentMatch[1].trim())
          const item = Array.isArray(parsed)
            ? parsed.find(i => i && (i['@type'] === 'JobPosting' || i['@type']?.includes?.('JobPosting')))
            : (parsed && (parsed['@type'] === 'JobPosting' || parsed['@type']?.includes?.('JobPosting')) ? parsed : (parsed['@graph'] ? parsed['@graph'].find((i: any) => i['@type'] === 'JobPosting') : null))

          if (item && item.title && (item.description || item.responsibilities)) {
            const rawDesc = item.description || item.responsibilities || ''
            const cleanDesc = stripHtmlTags(rawDesc)
            return {
              externalId: item.identifier?.value || item.jobImmediateStart || undefined,
              source: 'url-fetch',
              url,
              title: item.title.trim(),
              company: typeof item.hiringOrganization === 'string' ? item.hiringOrganization : item.hiringOrganization?.name || undefined,
              location: typeof item.jobLocation === 'string' ? item.jobLocation : item.jobLocation?.address?.addressLocality || item.jobLocation?.address?.addressRegion || undefined,
              publishedAt: item.datePosted || undefined,
              description: cleanDesc,
            }
          }
        } catch {
          // Ignore invalid JSON-LD blocks and continue to fallback
        }
      }
    }
  }

  // Strategy 2: OpenGraph & HTML Title metadata
  const titleMatch = html.match(/<meta\b[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                     html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)
  const titleRaw = titleMatch && titleMatch[1] ? titleMatch[1].trim() : 'Job Opportunity'
  const title = decodeHtmlEntities(titleRaw)

  const siteNameMatch = html.match(/<meta\b[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i)
  const companyRaw = siteNameMatch && siteNameMatch[1] ? siteNameMatch[1].trim() : undefined
  const company = companyRaw ? decodeHtmlEntities(companyRaw) : undefined

  // Strategy 3: Clean Body Extraction (Strip script, style, nav, header, footer)
  const cleanedBody = cleanHtmlBody(html)

  return {
    source: 'url-fetch',
    url,
    title,
    company,
    description: cleanedBody,
  }
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function stripHtmlTags(htmlStr: string): string {
  return htmlStr
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function cleanHtmlBody(html: string): string {
  let bodyHtml = html
  const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)
  if (bodyMatch && bodyMatch[1]) {
    bodyHtml = bodyMatch[1]
  }

  // Remove nav, header, footer, script, style, noscript, iframe
  bodyHtml = bodyHtml
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, '')

  const text = stripHtmlTags(bodyHtml)
  return text.split('\n').map(line => line.trim()).filter(Boolean).join('\n')
}

// ---- UrlOpportunitySource Concrete Class -------------------------------------

export class UrlOpportunitySource implements OpportunitySource {
  private readonly options: SafeFetchOptions

  constructor(options: SafeFetchOptions = {}) {
    this.options = options
  }

  async fetch(input: OpportunitySourceInput): Promise<RawOpportunity> {
    const { finalUrl, html } = await fetchSafeContent(input.url, this.options)
    return extractJobFromHtml(finalUrl, html)
  }
}

// ---- GreenhousePublicSource Concrete Class ---------------------------------

export interface GreenhouseJobItem {
  id: number
  internal_job_id: number
  title: string
  location?: { name?: string }
  absolute_url: string
  updated_at: string
  content?: string
}

export class GreenhousePublicSource implements OpportunitySource {
  private readonly boardToken: string
  private readonly options: SafeFetchOptions

  constructor(boardToken: string, options: SafeFetchOptions = {}) {
    this.boardToken = boardToken
    this.options = options
  }

  async fetch(input: OpportunitySourceInput): Promise<RawOpportunity> {
    const url = input.url.includes('boards-api.greenhouse.io')
      ? input.url
      : `https://boards-api.greenhouse.io/v1/boards/${this.boardToken}/jobs/${input.url}?content=true`

    const { html } = await fetchSafeContent(url, this.options)
    const data = JSON.parse(html) as GreenhouseJobItem

    return {
      externalId: String(data.id),
      source: 'greenhouse',
      url: data.absolute_url || url,
      title: data.title,
      company: this.boardToken,
      location: data.location?.name || undefined,
      publishedAt: data.updated_at || undefined,
      description: stripHtmlTags(data.content || ''),
    }
  }

  async fetchAllBoardJobs(): Promise<RawOpportunity[]> {
    const listUrl = `https://boards-api.greenhouse.io/v1/boards/${this.boardToken}/jobs?content=true`
    const { html } = await fetchSafeContent(listUrl, this.options)
    const data = JSON.parse(html) as { jobs: GreenhouseJobItem[] }

    if (!data.jobs || !Array.isArray(data.jobs)) {
      return []
    }

    return data.jobs.map(job => ({
      externalId: String(job.id),
      source: 'greenhouse' as const,
      url: job.absolute_url || `https://boards.greenhouse.io/${this.boardToken}/jobs/${job.id}`,
      title: job.title,
      company: this.boardToken,
      location: job.location?.name || undefined,
      publishedAt: job.updated_at || undefined,
      description: stripHtmlTags(job.content || ''),
    }))
  }
}

