import {
	BaseBoxShapeUtil,
	TLBaseShape,
	HTMLContainer,
	RecordProps,
	T,
	Geometry2d,
	Rectangle2d,
} from 'tldraw'
import { ShapeSizes, useDynamicShapeSize } from '../utils/dynamicSizing'

export type YrkesbarometerShape = TLBaseShape<
	'yrkesbarometer',
	{
		w: number
		h: number
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
>

export class YrkesbarometerShapeUtil extends BaseBoxShapeUtil<YrkesbarometerShape> {
	static override type = 'yrkesbarometer' as const

	static override props: RecordProps<YrkesbarometerShape> = {
		w: T.number,
		h: T.number,
		yrkesomrade: T.string,
		yb_yrke: T.string,
		yb_concept_id: T.string,
		lan: T.string,
		antal_ssyk: T.number,
		del_av_ssyk: T.number,
		ssyk: T.string,
		ssyk_text: T.string,
		yb_beskrivning: T.string,
		jobbmojligheter: T.string,
		rekryteringssituation: T.string,
		paradox: T.arrayOf(T.any),
		prognos: T.string,
		text_jobbmojligheter: T.string,
		text_rekryteringssituation: T.string,
		hogsta_bedomningsniva: T.string,
		delvis_helt: T.string,
		omgang: T.string,
		taxonomi_version: T.number,
	}

	override getDefaultProps(): YrkesbarometerShape['props'] {
		return {
			w: 400,
			h: 300,
			yrkesomrade: 'Administration, ekonomi, juridik',
			yb_yrke: 'Administrativa assistenter',
			yb_concept_id: 'PDNm_NZ2_WRh',
			lan: '00',
			antal_ssyk: 1,
			del_av_ssyk: 0,
			ssyk: '4119',
			ssyk_text: 'Övriga kontorsassistenter och sekreterare',
			yb_beskrivning: '',
			jobbmojligheter: 'små',
			rekryteringssituation: 'överskott',
			paradox: [],
			prognos: 'vara oförändrad',
			text_jobbmojligheter: 'Nationellt bedöms möjligheterna till arbete som administrativ assistent vara små.',
			text_rekryteringssituation: 'Nationellt bedöms rekryteringssituationen för administrativa assistenter kännetecknas av överskott.',
			hogsta_bedomningsniva: 'nationellt',
			delvis_helt: 'helt',
			omgang: '2025-2',
			taxonomi_version: 27
		}
	}

	override getGeometry(shape: YrkesbarometerShape): Geometry2d {
		const size = ShapeSizes.get(this.editor).get(shape.id)
		return new Rectangle2d({
			width: size?.width ?? 400,
			height: size?.height ?? 300,
			isFilled: true,
		})
	}

	override component(shape: YrkesbarometerShape) {
		const ref = useDynamicShapeSize(shape.id)
		const data = shape.props

		const formatJobOpportunities = (opportunity: string) => {
			const opportunityMap: { [key: string]: string } = {
				'små': 'Små möjligheter',
				'stora': 'Stora möjligheter',
				'medelstora': 'Medelstora möjligheter'
			}
			return opportunityMap[opportunity] || opportunity
		}

		const formatRecruitmentSituation = (situation: string) => {
			const situationMap: { [key: string]: string } = {
				'överskott': 'Överskott',
				'brist': 'Brist',
				'balans': 'Balans'
			}
			return situationMap[situation] || situation
		}

		const formatPrognosis = (prognosis: string) => {
			const prognosisMap: { [key: string]: string } = {
				'vara oförändrad': 'Oförändrad',
				'öka': 'Öka',
				'minska': 'Minska'
			}
			return prognosisMap[prognosis] || prognosis
		}

		const getOpportunityColor = (opportunity: string) => {
			switch (opportunity) {
				case 'stora': return 'text-green-600 bg-green-50'
				case 'medelstora': return 'text-yellow-600 bg-yellow-50'
				case 'små': return 'text-red-600 bg-red-50'
				default: return 'text-gray-600 bg-gray-50'
			}
		}

		const getRecruitmentColor = (situation: string) => {
			switch (situation) {
				case 'brist': return 'text-red-600 bg-red-50'
				case 'balans': return 'text-green-600 bg-green-50'
				case 'överskott': return 'text-yellow-600 bg-yellow-50'
				default: return 'text-gray-600 bg-gray-50'
			}
		}

		return (
			<HTMLContainer className="pointer-events-auto">
				<div
					ref={ref}
					className="p-6 bg-white rounded-xl shadow-lg border border-gray-200 font-inter min-w-[400px]"
				>
				{/* Header */}
				<div className="mb-4">
					<h3 className="text-xl font-bold text-gray-800 mb-1">
						{data.yb_yrke}
					</h3>
					<p className="text-sm text-gray-600">
						{data.yrkesomrade}
					</p>
					{data.ssyk_text && (
						<p className="text-xs text-gray-500 mt-1">
							SSYK: {data.ssyk_text}
						</p>
					)}
				</div>

				{/* Key Metrics */}
				<div className="grid grid-cols-1 gap-3 mb-4">
					{/* Job Opportunities */}
					<div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
						<div>
							<div className="text-sm font-medium text-gray-700">Arbetsmöjligheter</div>
							<div className="text-xs text-gray-500">Nationellt</div>
						</div>
						<div className={`px-3 py-1 rounded-full text-sm font-medium ${getOpportunityColor(data.jobbmojligheter)}`}>
							{formatJobOpportunities(data.jobbmojligheter)}
						</div>
					</div>

					{/* Recruitment Situation */}
					<div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
						<div>
							<div className="text-sm font-medium text-gray-700">Rekryteringssituation</div>
							<div className="text-xs text-gray-500">Nationellt</div>
						</div>
						<div className={`px-3 py-1 rounded-full text-sm font-medium ${getRecruitmentColor(data.rekryteringssituation)}`}>
							{formatRecruitmentSituation(data.rekryteringssituation)}
						</div>
					</div>

					{/* Prognosis */}
					<div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
						<div>
							<div className="text-sm font-medium text-gray-700">Prognos (5 år)</div>
							<div className="text-xs text-gray-500">Framtidsutveckling</div>
						</div>
						<div className="px-3 py-1 rounded-full text-sm font-medium text-gray-700 bg-gray-100">
							{formatPrognosis(data.prognos)}
						</div>
					</div>
				</div>

				{/* Detailed Text */}
				<div className="space-y-3">
					{data.text_jobbmojligheter && (
						<div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
							<div className="text-xs font-medium text-blue-800 mb-1">Arbetsmöjligheter</div>
							<div className="text-sm text-blue-700 leading-relaxed">
								{data.text_jobbmojligheter}
							</div>
						</div>
					)}

					{data.text_rekryteringssituation && (
						<div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
							<div className="text-xs font-medium text-purple-800 mb-1">Rekryteringssituation</div>
							<div className="text-sm text-purple-700 leading-relaxed">
								{data.text_rekryteringssituation}
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="mt-4 pt-3 border-t border-gray-200">
					<div className="flex justify-between items-center text-xs text-gray-500">
						<span>Yrkesbarometer {data.omgang}</span>
						<span>SSYK {data.ssyk}</span>
					</div>
				</div>
				</div>
			</HTMLContainer>
		)
	}

	override indicator(shape: YrkesbarometerShape) {
		const { width, height } = this.editor.getShapeGeometry(shape).bounds
		return <rect width={width} height={height} />
	}

	override canResize = () => false
	override canEdit = () => false
	override canBind = () => false
}
