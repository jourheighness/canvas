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
import { ErrorBoundary, useErrorLogger } from '../components/ErrorBoundary'

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
	const { logError } = useErrorLogger()

	const store = useSyncDemo({
		roomId: roomId || 'default-room',
		shapeUtils: customShapeUtils,
	})

	// Get license key from environment variables (Cloudflare Workers + Vite)
	const licenseKey = process.env.VITE_TLDRAW_LICENSE_KEY || 
		process.env.TLDRAW_LICENSE_KEY ||
		undefined

	// Debug license key
	useEffect(() => {
		console.log('License key check:', {
			VITE_TLDRAW_LICENSE_KEY: process.env.VITE_TLDRAW_LICENSE_KEY,
			TLDRAW_LICENSE_KEY: process.env.TLDRAW_LICENSE_KEY,
			finalLicenseKey: licenseKey,
			hasLicenseKey: !!licenseKey,
			allProcessEnv: process.env
		})
	}, [licenseKey])

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

	// Add error logging for unhandled errors
	useEffect(() => {
		const handleError = (event: ErrorEvent) => {
			logError(new Error(event.message), 'Global error handler')
		}

		const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
			logError(new Error(event.reason), 'Unhandled promise rejection')
		}

		window.addEventListener('error', handleError)
		window.addEventListener('unhandledrejection', handleUnhandledRejection)

		return () => {
			window.removeEventListener('error', handleError)
			window.removeEventListener('unhandledrejection', handleUnhandledRejection)
		}
	}, [logError])

	return (
		<RoomWrapper roomId={roomId}>
			<ErrorBoundary>
				<Tldraw
					store={store}
					deepLinks
					hideUi={true}
					components={components}
					shapeUtils={customShapeUtils}
					licenseKey={licenseKey}
					onMount={(editor) => {
						try {
							editor.updateInstanceState({ isGridMode: true })
							editor.user.updateUserPreferences({ isSnapMode: false })
							window.tldrawEditor = editor
							console.log('Editor mounted successfully')
						} catch (error) {
							logError(error as Error, 'Editor onMount')
						}
					}}
				/>
			</ErrorBoundary>
			<ErrorBoundary>
				<LeftSidebar />
			</ErrorBoundary>
		</RoomWrapper>
	)
}