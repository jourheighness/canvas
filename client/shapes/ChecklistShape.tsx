import { MouseEvent } from 'react'
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

export type ChecklistShape = TLBaseShape<
	'checklist',
	{
		w: number
		h: number
		title: string
		items: string[]
		checkedItems: boolean[]
	}
>

export class ChecklistShapeUtil extends BaseBoxShapeUtil<ChecklistShape> {
	static override type = 'checklist' as const

	static override props: RecordProps<ChecklistShape> = {
		w: T.number,
		h: T.number,
		title: T.string,
		items: T.arrayOf(T.string),
		checkedItems: T.arrayOf(T.boolean),
	}

	override getDefaultProps(): ChecklistShape['props'] {
		return {
			w: 300,
			h: 200,
			title: 'Checklist',
			items: ['Complete project', 'Review code', 'Deploy to production'],
			checkedItems: [false, false, false],
		}
	}

	override getGeometry(shape: ChecklistShape): Geometry2d {
		const size = ShapeSizes.get(this.editor).get(shape.id)
		return new Rectangle2d({
			width: size?.width ?? 300,
			height: size?.height ?? 200,
			isFilled: true,
		})
	}

	override component(shape: ChecklistShape) {
		const ref = useDynamicShapeSize(shape.id)
		
		const updateTitle = (event: MouseEvent, newTitle: string) => {
			event.stopPropagation()
			this.editor.updateShape({
				id: shape.id,
				type: 'checklist',
				props: { title: newTitle },
			})
		}

		const toggleItem = (event: MouseEvent, index: number) => {
			event.stopPropagation()
			const newCheckedItems = [...shape.props.checkedItems]
			newCheckedItems[index] = !newCheckedItems[index]
			this.editor.updateShape({
				id: shape.id,
				type: 'checklist',
				props: { checkedItems: newCheckedItems },
			})
		}

		const updateItem = (event: MouseEvent, index: number, newValue: string) => {
			event.stopPropagation()
			const newItems = [...shape.props.items]
			newItems[index] = newValue
			this.editor.updateShape({
				id: shape.id,
				type: 'checklist',
				props: { items: newItems },
			})
		}

		const deleteItem = (event: MouseEvent, index: number) => {
			event.stopPropagation()
			const newItems = [...shape.props.items]
			const newCheckedItems = [...shape.props.checkedItems]
			newItems.splice(index, 1)
			newCheckedItems.splice(index, 1)
			this.editor.updateShape({
				id: shape.id,
				type: 'checklist',
				props: { 
					items: newItems,
					checkedItems: newCheckedItems
				},
			})
		}

		const addItem = (event: MouseEvent) => {
			event.stopPropagation()
			const newItems = [...shape.props.items, 'New Task']
			const newCheckedItems = [...shape.props.checkedItems, false]
			this.editor.updateShape({
				id: shape.id,
				type: 'checklist',
				props: { 
					items: newItems,
					checkedItems: newCheckedItems
				},
			})
		}

		return (
			<HTMLContainer className="pointer-events-auto">
				<div
					ref={ref}
					className="p-5 bg-white rounded-xl shadow-lg font-inter flex flex-col min-w-[300px] border border-gray-200"
				>
				{/* Drag Handle */}
				<div className="flex items-center justify-center mb-4 pb-3 border-b border-gray-100 cursor-move hover:bg-gray-50 transition-colors duration-200">
					<div className="flex space-x-1">
						<div className="w-1 h-1 bg-gray-300 rounded-full"></div>
						<div className="w-1 h-1 bg-gray-300 rounded-full"></div>
						<div className="w-1 h-1 bg-gray-300 rounded-full"></div>
						<div className="w-1 h-1 bg-gray-300 rounded-full"></div>
						<div className="w-1 h-1 bg-gray-300 rounded-full"></div>
						<div className="w-1 h-1 bg-gray-300 rounded-full"></div>
					</div>
				</div>
				
				{/* Title */}
				<input
					type="text"
					value={shape.props.title}
					onChange={(e) => updateTitle(e as any, e.target.value)}
					onPointerDown={this.editor.markEventAsHandled}
					className="mb-4 text-lg font-semibold text-gray-700 bg-transparent border-2 border-transparent rounded px-2 py-1 w-full outline-none transition-colors duration-200 hover:border-gray-200 focus:border-gray-400"
				/>
				
				{/* Items */}
				<div className="flex-1 overflow-y-auto mb-3">
					{shape.props.items.map((item, index) => (
						<div
							key={index}
							className="flex items-center mb-2 p-1 rounded transition-colors duration-200 hover:bg-gray-50"
						>
							<input
								type="checkbox"
								checked={shape.props.checkedItems[index]}
								onChange={(e) => toggleItem(e as any, index)}
								onPointerDown={this.editor.markEventAsHandled}
								className="mr-2 scale-125"
							/>
							<input
								type="text"
								value={item}
								onChange={(e) => updateItem(e as any, index, e.target.value)}
								onPointerDown={this.editor.markEventAsHandled}
										className={`flex-1 bg-transparent border border-transparent rounded px-1.5 py-0.5 text-sm outline-none transition-all duration-200 ${
											shape.props.checkedItems[index]
												? 'text-gray-400 line-through'
												: 'text-gray-600 hover:border-gray-200 focus:border-gray-400'
										}`}
							/>
							<button
								onClick={(e) => deleteItem(e as any, index)}
								onPointerDown={this.editor.markEventAsHandled}
								className="ml-2 bg-gray-500 text-white border-none rounded w-5 h-5 text-xs cursor-pointer flex items-center justify-center opacity-70 transition-opacity duration-200 hover:opacity-100 hover:bg-gray-600"
							>
								×
							</button>
						</div>
					))}
				</div>
				
				{/* Add Item Button */}
				<button
					onClick={addItem}
					onPointerDown={this.editor.markEventAsHandled}
					className="bg-gray-600 hover:bg-gray-700 text-white rounded-lg px-3 py-2 text-sm cursor-pointer flex items-center justify-center gap-1 transition-colors duration-200"
				>
					<span>+</span>
					<span>Lägg till uppgift</span>
					</button>
				</div>
			</HTMLContainer>
		)
	}


	override indicator(shape: ChecklistShape) {
		const { width, height } = this.editor.getShapeGeometry(shape).bounds
		return <rect width={width} height={height} />
	}

	override canResize = () => false
	override canEdit = () => false
	override canBind = () => false
}
