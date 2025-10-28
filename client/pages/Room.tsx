import { useSyncDemo } from '@tldraw/sync'
import { useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { Tldraw, TLComponents } from 'tldraw'
import { Toolbar } from '../components/Toolbar'
import { LeftSidebar } from '../components/LeftSidebar'
import { RoomWrapper } from '../components/RoomWrapper'
import { CustomDotGrid } from '../components/CustomDotGrid'
import { ChecklistShapeUtil } from '../shapes/ChecklistShape'
import { YrkesbarometerShapeUtil } from '../shapes/YrkesbarometerShape'

declare global {
	interface Window {
		tldrawEditor: any
	}
}

const components: TLComponents = {
	Grid: CustomDotGrid,
	InFrontOfTheCanvas: () => (
		<>
			<Toolbar />
		</>
	),
}

const customShapeUtils = [ChecklistShapeUtil, YrkesbarometerShapeUtil]

export function Room() {
	const { roomId } = useParams<{ roomId: string }>()

	const store = useSyncDemo({
		roomId: roomId || 'default-room',
		shapeUtils: customShapeUtils,
	})

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const editor = window.tldrawEditor
			if (!editor) return

			if (e.key === 'Backspace' || e.key === 'Delete') {
				const target = e.target as HTMLElement
				if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
					return
				}

				const selectedShapes = editor.getSelectedShapes()
				if (selectedShapes.length > 0) {
					editor.deleteShapes(selectedShapes.map((shape: any) => shape.id))
					e.preventDefault()
				}
			}
		}

		document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [])

	return (
		<RoomWrapper roomId={roomId}>
			<Tldraw
				store={store}
				deepLinks
				hideUi={true}
				components={components}
				shapeUtils={customShapeUtils}
				onMount={(editor) => {
					editor.updateInstanceState({ isGridMode: true })
					editor.user.updateUserPreferences({ isSnapMode: false })
					window.tldrawEditor = editor
				}}
			/>
			<LeftSidebar />
		</RoomWrapper>
	)
}