import { YrkesbarometerItem } from '../utils/yrkesbarometerSearch'

interface YrkesbarometerShapeProps {
	position: { x: number; y: number }
	data: YrkesbarometerItem
	width?: number
	height?: number
}

export function createYrkesbarometerShape({ 
	position, 
	data,
	width = 400,
	height = 300
}: YrkesbarometerShapeProps) {
	// Validate required data
	if (!data) {
		throw new Error('YrkesbarometerItem data is required')
	}

	if (!data.yb_yrke || !data.yrkesomrade) {
		throw new Error('Required fields yb_yrke and yrkesomrade are missing')
	}

	return {
		type: 'yrkesbarometer' as const,
		x: position.x,
		y: position.y,
		props: {
			w: width,
			h: height,
			yrkesomrade: data.yrkesomrade || '',
			yb_yrke: data.yb_yrke || '',
			yb_concept_id: data.yb_concept_id || '',
			lan: data.lan || '',
			antal_ssyk: data.antal_ssyk || 0,
			del_av_ssyk: data.del_av_ssyk || 0,
			ssyk: data.ssyk || '',
			ssyk_text: data.ssyk_text || '',
			yb_beskrivning: data.yb_beskrivning || '',
			jobbmojligheter: data.jobbmojligheter || '',
			rekryteringssituation: data.rekryteringssituation || '',
			paradox: data.paradox || [],
			prognos: data.prognos || '',
			text_jobbmojligheter: data.text_jobbmojligheter || '',
			text_rekryteringssituation: data.text_rekryteringssituation || '',
			hogsta_bedomningsniva: data.hogsta_bedomningsniva || '',
			delvis_helt: data.delvis_helt || '',
			omgang: data.omgang || '',
			taxonomi_version: data.taxonomi_version || 0,
		},
	}
}
