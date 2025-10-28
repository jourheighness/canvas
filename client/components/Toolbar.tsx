import { useMemo, useRef } from 'react'
import { Vec, useAtom, useEditor, useQuickReactor, useValue, Box } from 'tldraw'
import { createPostItShape } from './PostIt'
import { createChecklistShape } from './Checklist'
import { Pen, StickyNote, CheckSquare, MousePointer, Square } from 'lucide-react'

// Define tools (immediate activation)
const TOOLS = [
	{
		id: 'select',
		icon: MousePointer,
		label: 'Välj',
		shapeType: 'select' as const,
	},
	{
		id: 'pen',
		icon: Pen,
		label: 'Penna',
		shapeType: 'draw' as const,
		shapeProps: {
			color: 'black',
			size: 'm',
			fill: 'none',
			dash: 'draw',
			isComplete: false,
			isClosed: false,
		},
	},
	{
		id: 'frame',
		icon: Square,
		label: 'Ram',
		shapeType: 'frame' as const,
	},
] as const

// Define draggable components (drag to create)
const DRAGGABLE_COMPONENTS = [
	{
		id: 'postit',
		icon: StickyNote,
		label: 'Klisterlapp',
		shapeType: 'note' as const,
		shapeProps: {
			color: 'grey',
			size: 'm',
			font: 'draw',
		},
	},
	{
		id: 'checklist',
		icon: CheckSquare,
		label: 'Checklista',
		shapeType: 'checklist' as const,
	},
] as const

type DraggableComponent = typeof DRAGGABLE_COMPONENTS[number]

// Drag state machine
type DragState =
	| {
			name: 'idle'
	  }
	| {
			name: 'pointing_item'
			item: DraggableComponent
			startPosition: Vec
	  }
	| {
			name: 'dragging'
			item: DraggableComponent
			currentPosition: Vec
	  }

export function Toolbar() {
	const rTrayContainer = useRef<HTMLDivElement>(null)
	const rDraggingImage = useRef<HTMLDivElement>(null)

	const editor = useEditor()

	// Get current tool state
	const currentTool = useValue('currentTool', () => editor.getCurrentTool().id, [editor])

	// Drag state atom
	const dragState = useAtom<DragState>('dragState', () => ({
		name: 'idle',
	}))

	// Event handlers
	const { handlePointerUp, handlePointerDown } = useMemo(() => {
		let target: HTMLDivElement | null = null

		function handlePointerMove(e: PointerEvent) {
			const current = dragState.get()
			const screenPoint = new Vec(e.clientX, e.clientY)

			switch (current.name) {
				case 'idle': {
					break
				}
				case 'pointing_item': {
					const dist = Vec.Dist(screenPoint, current.startPosition)
					if (dist > 10) {
						dragState.set({
							name: 'dragging',
							item: current.item,
							currentPosition: screenPoint,
						})
					}
					break
				}
				case 'dragging': {
					dragState.set({
						...current,
						currentPosition: screenPoint,
					})
					break
				}
			}
		}

		function handlePointerUp(e: React.PointerEvent) {
			const current = dragState.get()

			target = e.currentTarget as HTMLDivElement
			target.releasePointerCapture(e.pointerId)

			switch (current.name) {
				case 'idle': {
					break
				}
				case 'pointing_item': {
					dragState.set({
						name: 'idle',
					})
					break
				}
				case 'dragging': {
					const screenPoint = new Vec(e.clientX, e.clientY)
					const pagePoint = editor.screenToPage(screenPoint)

					editor.markHistoryStoppingPoint('create shape from toolbar')

					if (current.item.shapeType === 'note') {
						const postItShape = createPostItShape({ 
							position: { x: pagePoint.x - 100, y: pagePoint.y - 100 } 
						})
						editor.createShapes([postItShape])
					} else if (current.item.shapeType === 'checklist') {
						const checklistShape = createChecklistShape({ 
							position: { x: pagePoint.x - 150, y: pagePoint.y - 100 },
						})
						editor.createShapes([checklistShape])
					}

					dragState.set({
						name: 'idle',
					})
					break
				}
			}

			removeEventListeners()
		}

		function handlePointerDown(e: React.PointerEvent) {
			e.preventDefault()
			target = e.currentTarget as HTMLDivElement
			target.setPointerCapture(e.pointerId)

			const itemIndex = target.dataset.drag_item_index!
			const itemType = target.dataset.item_type!

			if (itemType === 'tool') {
				// Handle tool activation
				const tool = TOOLS[+itemIndex]
				if (!tool) return

				// Activate tool immediately
				if (tool.shapeType === 'draw') {
					editor.setCurrentTool('draw')
				} else if (tool.shapeType === 'select') {
					editor.setCurrentTool('select')
				} else if (tool.shapeType === 'frame') {
					editor.setCurrentTool('frame')
				}
				return
			}

			if (itemType === 'component') {
				// Handle draggable component
				const component = DRAGGABLE_COMPONENTS[+itemIndex]
				if (!component) return

				// Deactivate any active tools first
				editor.setCurrentTool('select')

				const startPosition = new Vec(e.clientX, e.clientY)

				dragState.set({
					name: 'pointing_item',
					item: component,
					startPosition,
				})

				target.addEventListener('pointermove', handlePointerMove)
				document.addEventListener('keydown', handleKeyDown)
			}
		}

		function handleKeyDown(e: KeyboardEvent) {
			const current = dragState.get()
			if (e.key === 'Escape' && current.name === 'dragging') {
				removeEventListeners()
			}
		}

		function removeEventListeners() {
			if (target) {
				target.removeEventListener('pointermove', handlePointerMove)
				document.removeEventListener('keydown', handleKeyDown)
			}

			dragState.set({
				name: 'idle',
			})
		}

		return {
			handlePointerDown,
			handlePointerUp,
		}
	}, [dragState, editor])

	const state = useValue('dragState', () => dragState.get(), [dragState])

	// Drag preview management
	useQuickReactor(
		'drag-image-style',
		() => {
			const current = dragState.get()
			const imageRef = rDraggingImage.current
			const trayContainerRef = rTrayContainer.current
			if (!imageRef || !trayContainerRef) return

			switch (current.name) {
				case 'idle':
				case 'pointing_item': {
					imageRef.style.display = 'none'
					break
				}
				case 'dragging': {
					const trayContainerRect = trayContainerRef.getBoundingClientRect()
					const box = new Box(
						trayContainerRect.x,
						trayContainerRect.y,
						trayContainerRect.width,
						trayContainerRect.height
					)
					const viewportScreenBounds = editor.getViewportScreenBounds()
					const isInside = Box.ContainsPoint(box, current.currentPosition)
					if (isInside) {
						imageRef.style.display = 'none'
					} else {
						imageRef.style.display = 'block'
						imageRef.style.position = 'absolute'
						imageRef.style.pointerEvents = 'none'
						imageRef.style.left = '0px'
						imageRef.style.top = '0px'
						imageRef.style.transform = `translate(${current.currentPosition.x - viewportScreenBounds.x - 25}px, ${current.currentPosition.y - viewportScreenBounds.y - 25}px)`
						imageRef.style.width = '50px'
						imageRef.style.height = '50px'
						imageRef.style.fontSize = '40px'
						imageRef.style.display = 'flex'
						imageRef.style.alignItems = 'center'
						imageRef.style.justifyContent = 'center'
						imageRef.style.background = 'rgba(255, 255, 255, 0.9)'
						imageRef.style.borderRadius = '8px'
						imageRef.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)'
					}
				}
			}
		},
		[dragState]
	)

	return (
		<>
			<div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-lg z-[1000] pointer-events-auto overflow-hidden border border-gray-200" ref={rTrayContainer}>
				<div className="flex flex-row gap-3 p-4">
					{/* Tools Section */}
					<div className="flex flex-row gap-3">
						{TOOLS.map((tool, index) => {
							const isActive = 
								(tool.shapeType === 'draw' && currentTool === 'draw') ||
								(tool.shapeType === 'select' && currentTool === 'select') ||
								(tool.shapeType === 'frame' && currentTool === 'frame')
							return (
								<div
									key={tool.id}
									className={`flex flex-col items-center justify-center gap-2 w-[90px] h-[90px] rounded-lg transition-all duration-200 ease-in-out select-none text-lg p-3 hover:bg-blue-50 hover:-translate-y-0.5 hover:shadow-md active:cursor-pointer active:translate-y-[-1px] active:scale-[0.98] active:shadow-sm ${
										isActive
											? 'bg-blue-100 cursor-default shadow-md border-2 border-blue-300'
											: 'cursor-pointer border-2 border-transparent'
									}`}
									data-drag_item_index={index}
									data-item_type="tool"
									onPointerDown={handlePointerDown}
									onPointerUp={handlePointerUp}
									title={tool.label}
								>
									<div className={`text-[32px] transition-transform duration-200 ${
										isActive
											? 'scale-110 text-blue-600'
											: 'hover:scale-110 active:scale-95 text-gray-600'
									}`}>
										<tool.icon size={32} />
									</div>
									<div className={`text-xs font-medium text-center leading-tight ${
										isActive 
											? 'text-blue-800 font-semibold' 
											: 'text-gray-700'
									}`}>
										{tool.label}
									</div>
								</div>
							)
						})}
					</div>

					{/* Divider */}
					<div className="w-px bg-gray-300 mx-2"></div>

					{/* Draggable Components Section */}
					<div className="flex flex-row gap-3">
						{DRAGGABLE_COMPONENTS.map((component, index) => (
							<div
								key={component.id}
								className="flex flex-col items-center justify-center gap-2 w-[90px] h-[90px] rounded-lg transition-all duration-200 ease-in-out select-none text-lg p-3 hover:bg-green-50 hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing active:translate-y-[-1px] active:scale-[0.98] active:shadow-sm cursor-grab border-2 border-transparent hover:border-green-200"
								data-drag_item_index={index}
								data-item_type="component"
								onPointerDown={handlePointerDown}
								onPointerUp={handlePointerUp}
								title={component.label}
							>
								<div className="text-[32px] transition-transform duration-200 hover:scale-110 active:scale-95 text-gray-600">
									<component.icon size={32} />
								</div>
								<div className="text-xs font-medium text-center leading-tight text-gray-700">
									{component.label}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
			<div ref={rDraggingImage}>
				{state.name === 'dragging' && <state.item.icon size={40} />}
			</div>
		</>
	)
}
