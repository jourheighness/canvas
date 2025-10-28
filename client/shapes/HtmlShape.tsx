import {
	BaseBoxShapeUtil,
	TLBaseShape,
	HTMLContainer,
	RecordProps,
	T,
	Geometry2d,
	Rectangle2d,
} from 'tldraw'

export type HtmlShape = TLBaseShape<
	'html',
	{
		w: number
		h: number
		html: string
	}
>

export class HtmlShapeUtil extends BaseBoxShapeUtil<HtmlShape> {
	static override type = 'html' as const

	static override props: RecordProps<HtmlShape> = {
		w: T.number,
		h: T.number,
		html: T.string,
	}

	override getDefaultProps(): HtmlShape['props'] {
		return {
			w: 300,
			h: 200,
			html: '<div style="padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"><h2>HTML Shape</h2><p>This is a test HTML component embedded in tldraw!</p></div>',
		}
	}

	override getGeometry(shape: HtmlShape): Geometry2d {
		return new Rectangle2d({
			width: shape.props.w,
			height: shape.props.h,
			isFilled: true,
		})
	}

	override component(shape: HtmlShape) {
		return (
			<HTMLContainer
				id={shape.id}
				style={{
					width: shape.props.w,
					height: shape.props.h,
					pointerEvents: 'all',
					overflow: 'hidden',
				}}
			>
				<div
					dangerouslySetInnerHTML={{ __html: shape.props.html }}
					style={{
						width: '100%',
						height: '100%',
						pointerEvents: 'all',
					}}
				/>
			</HTMLContainer>
		)
	}

	override indicator(shape: HtmlShape) {
		return <rect width={shape.props.w} height={shape.props.h} />
	}

	override canResize = () => true
	override canEdit = () => false
	override canBind = () => false
}

