// Search utility for Yrkesbarometer data
export interface YrkesbarometerItem {
	yrkesomrade: string
	yb_yrke: string
	yb_concept_id: string
	lan: string
	antal_ssyk: number
	del_av_ssyk: number
	ssyk: string
	ssyk_text: string
	yb_beskrivning: string | null
	jobbmojligheter: string
	rekryteringssituation: string
	paradox: any[]
	prognos: string
	text_jobbmojligheter: string
	text_rekryteringssituation: string
	hogsta_bedomningsniva: string
	delvis_helt: string
	omgang: string
	taxonomi_version: number
}

export interface SearchResult {
	item: YrkesbarometerItem
	score: number
	matchedFields: string[]
}

export class YrkesbarometerSearch {
	private data: YrkesbarometerItem[]

	constructor(data: YrkesbarometerItem[]) {
		this.data = data
	}

	search(query: string, limit: number = 10): SearchResult[] {
		if (!query.trim()) return []

		const normalizedQuery = this.normalizeText(query)
		const results: SearchResult[] = []

		for (const item of this.data) {
			// Only include results from county "00" (whole country)
			if (item.lan !== '00') continue
			
			const score = this.calculateScore(item, normalizedQuery)
			if (score > 0) {
				results.push({
					item,
					score,
					matchedFields: this.getMatchedFields(item, normalizedQuery)
				})
			}
		}

		// Sort by score (highest first) and limit results
		return results
			.sort((a, b) => b.score - a.score)
			.slice(0, limit)
	}

	private normalizeText(text: string): string {
		return text
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '') // Remove diacritics
			.trim()
	}

	private calculateScore(item: YrkesbarometerItem, query: string): number {
		let score = 0
		const fields = [
			{ field: item.yb_yrke, weight: 10 }, // Job title - highest weight
			{ field: item.yrkesomrade, weight: 8 }, // Professional area
			{ field: item.ssyk_text, weight: 6 }, // SSYK text
			{ field: item.prognos, weight: 5 }, // Prognosis
			{ field: item.text_jobbmojligheter, weight: 3 }, // Job opportunities text
			{ field: item.text_rekryteringssituation, weight: 3 }, // Recruitment text
			{ field: item.jobbmojligheter, weight: 2 }, // Job opportunities
			{ field: item.rekryteringssituation, weight: 2 }, // Recruitment situation
		]

		for (const { field, weight } of fields) {
			if (field) {
				const normalizedField = this.normalizeText(field)
				
				// Exact match gets highest score
				if (normalizedField === query) {
					score += weight * 3
				}
				// Starts with query
				else if (normalizedField.startsWith(query)) {
					score += weight * 2
				}
				// Contains query
				else if (normalizedField.includes(query)) {
					score += weight
				}
				// Word boundary match
				else if (this.hasWordMatch(normalizedField, query)) {
					score += weight * 0.8
				}
			}
		}

		return score
	}

	private hasWordMatch(text: string, query: string): boolean {
		const words = text.split(/\s+/)
		return words.some(word => word.includes(query))
	}

	private getMatchedFields(item: YrkesbarometerItem, query: string): string[] {
		const matchedFields: string[] = []
		const normalizedQuery = this.normalizeText(query)

		if (item.yb_yrke && this.normalizeText(item.yb_yrke).includes(normalizedQuery)) {
			matchedFields.push('Yrke')
		}
		if (item.yrkesomrade && this.normalizeText(item.yrkesomrade).includes(normalizedQuery)) {
			matchedFields.push('Yrkesområde')
		}
		if (item.prognos && this.normalizeText(item.prognos).includes(normalizedQuery)) {
			matchedFields.push('Prognos')
		}
		if (item.ssyk_text && this.normalizeText(item.ssyk_text).includes(normalizedQuery)) {
			matchedFields.push('SSYK')
		}

		return matchedFields
	}

	getUniqueProfessions(): string[] {
		const professions = new Set<string>()
		this.data.forEach(item => {
			// Only include professions from county "00" (whole country)
			if (item.lan === '00' && item.yb_yrke) {
				professions.add(item.yb_yrke)
			}
		})
		return Array.from(professions).sort()
	}

	getUniqueAreas(): string[] {
		const areas = new Set<string>()
		this.data.forEach(item => {
			// Only include areas from county "00" (whole country)
			if (item.lan === '00' && item.yrkesomrade) {
				areas.add(item.yrkesomrade)
			}
		})
		return Array.from(areas).sort()
	}
}
