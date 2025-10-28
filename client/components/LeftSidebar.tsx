import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { Vec, Box, Editor } from 'tldraw'
import { YrkesbarometerSearch, YrkesbarometerItem, SearchResult } from '../utils/yrkesbarometerSearch'
import { createYrkesbarometerShape } from './YrkesbarometerShape'
import yrkesbarometerData from '../../data/Yrkesbarometer.json'
import { BarChart3 } from 'lucide-react'
import { useErrorLogger } from './ErrorBoundary'

// Global editor access with proper timing handling
const useGlobalEditor = () => {
	const [editor, setEditor] = useState<Editor | null>(null)
	const { logError } = useErrorLogger()
	const pollCountRef = useRef(0)
	const maxPolls = 200 // Max 200 polls (10 seconds at 50ms intervals)
	
	useEffect(() => {
		// Check if editor is available
		const checkEditor = () => {
			if (window.tldrawEditor) {
				setEditor(window.tldrawEditor as Editor)
				return true
			}
			return false
		}
		
		// Check immediately
		if (checkEditor()) {
			return // Editor is already available
		}
		
		// Set up a more efficient polling mechanism with safety limits
		let timeoutId: ReturnType<typeof setTimeout>
		const pollForEditor = () => {
			pollCountRef.current++
			
			if (pollCountRef.current > maxPolls) {
				logError(new Error('Editor polling timeout - editor never became available'), 'useGlobalEditor')
				return
			}
			
			if (!checkEditor()) {
				timeoutId = setTimeout(pollForEditor, 50) // Check every 50ms
			}
		}
		
		pollForEditor()
		
		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId)
			}
		}
	}, [logError])
	
	return editor
}

// Types
interface MenuItem {
	id: string
	label: string
	icon?: string
	onClick?: () => void
	disabled?: boolean
}

type SidebarState = 'menu' | 'search-forecasts'

type DragState =
	| { name: 'idle' }
	| { name: 'pointing_item'; result: SearchResult; startPosition: Vec }
	| { name: 'dragging'; result: SearchResult; currentPosition: Vec }

// Constants
const MENU_ITEMS: MenuItem[] = [
	{ id: 'search-forecasts', label: 'Sök prognoser' },
	{ id: 'search-statistics', label: 'Sök statistik', disabled: true },
	{ id: 'search-training', label: 'Sök utbildningar', disabled: true },
	{ id: 'practice-material', label: 'Övningsmaterial', disabled: true },
	{ id: 'guides-articles', label: 'Guider och artiklar', disabled: true },
	{ id: 'meeting-templates', label: 'Mötesmallar', disabled: true },
]

const SIDEBAR_STYLES = {
	container: "fixed left-4 top-20 w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-[99999] overflow-hidden",
	header: "px-4 py-3 border-b border-gray-200",
	content: "px-4 py-4",
	menuContent: "px-3 py-2",
} as const

// Event handlers to prevent canvas interaction
const handleMouseDown = (e: React.MouseEvent) => {
	e.stopPropagation()
}

const handleWheel = (e: React.WheelEvent) => {
	e.stopPropagation()
}

const handlePointerDown = (e: React.PointerEvent) => {
	e.stopPropagation()
}

// Event handlers for interactive elements (don't prevent default)
const handleInteractiveMouseDown = (e: React.MouseEvent) => {
	e.stopPropagation()
	// Don't prevent default to allow normal interaction
}

const handleInteractivePointerDown = (e: React.PointerEvent) => {
	e.stopPropagation()
	// Don't prevent default to allow normal interaction
}

// MenuView Component
interface MenuViewProps {
	menuItems: MenuItem[]
	onMenuItemClick: (item: MenuItem) => void
}

function MenuView({ menuItems, onMenuItemClick }: MenuViewProps) {
	return (
		<div 
			className={SIDEBAR_STYLES.container} 
			style={{ pointerEvents: 'all' }}
			onMouseDown={handleMouseDown}
			onWheel={handleWheel}
			onPointerDown={handlePointerDown}
		>
			<div className={SIDEBAR_STYLES.header}>
				<h2 className="text-base font-bold text-black text-center">Verktygslåda</h2>
			</div>
			<div className={SIDEBAR_STYLES.menuContent}>
				{menuItems.map((item) => (
					<div
						key={item.id}
						className={`flex items-center justify-between py-3 px-3 rounded-lg transition-colors duration-200 group ${
							item.disabled
								? 'cursor-not-allowed opacity-50'
								: 'cursor-pointer hover:bg-gray-50'
						}`}
						onClick={() => !item.disabled && onMenuItemClick(item)}
						onMouseDown={handleMouseDown}
						onPointerDown={handlePointerDown}
					>
						<span className={`text-sm font-medium ${
							item.disabled ? 'text-gray-400' : 'text-black'
						}`}>
							{item.label}
						</span>
						{item.disabled ? (
							<svg
								className="w-3 h-3 text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
								/>
							</svg>
						) : (
							<svg
								className="w-3 h-3 text-black opacity-60 group-hover:opacity-100 transition-opacity duration-200"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 5l7 7-7 7"
								/>
							</svg>
						)}
					</div>
				))}
			</div>
		</div>
	)
}

// Fixed drag and drop hook using standard React hooks
function useDragAndDrop(searchResults: SearchResult[] = []) {
	const editor = useGlobalEditor()
	const rSidebarContainer = useRef<HTMLDivElement>(null)
	const rDraggingImage = useRef<HTMLDivElement>(null)
	
	// Use standard React state instead of useAtom
	const [dragState, setDragState] = useState<DragState>({ name: 'idle' })

	// Use refs to store current state and handlers
	const dragStateRef = useRef(dragState)
	const targetRef = useRef<HTMLDivElement | null>(null)
	
	// Update ref when state changes
	useEffect(() => {
		dragStateRef.current = dragState
	}, [dragState])

	const handlePointerMove = useCallback((e: PointerEvent) => {
		const current = dragStateRef.current
		const screenPoint = new Vec(e.clientX, e.clientY)

		switch (current.name) {
			case 'idle': {
				break
			}
			case 'pointing_item': {
				const dist = Vec.Dist(screenPoint, current.startPosition)
				if (dist > 10) {
					setDragState({
						name: 'dragging',
						result: current.result,
						currentPosition: screenPoint,
					})
				}
				break
			}
			case 'dragging': {
				setDragState({
					...current,
					currentPosition: screenPoint,
				})
				break
			}
		}
	}, [])

	const handleKeyDown = useCallback((e: KeyboardEvent) => {
		const current = dragStateRef.current
		if (e.key === 'Escape' && current.name === 'dragging') {
			removeEventListeners()
		}
	}, [])

	const removeEventListeners = useCallback(() => {
		if (targetRef.current) {
			targetRef.current.removeEventListener('pointermove', handlePointerMove)
			document.removeEventListener('keydown', handleKeyDown)
			targetRef.current = null
		}
		setDragState({ name: 'idle' })
	}, [handlePointerMove, handleKeyDown])

	const handlePointerUp = useCallback((e: React.PointerEvent) => {
		const current = dragStateRef.current
		const target = e.currentTarget as HTMLDivElement
		target.releasePointerCapture(e.pointerId)

		switch (current.name) {
			case 'idle': {
				break
			}
			case 'pointing_item': {
				setDragState({ name: 'idle' })
				break
			}
			case 'dragging': {
				const screenPoint = new Vec(e.clientX, e.clientY)
				const pagePoint = editor?.screenToPage(screenPoint)

				// Validate that we have a valid result, editor, and pagePoint
				if (!current.result || !current.result.item || !editor || !pagePoint) {
					// Silently reset state if editor isn't ready
					setDragState({ name: 'idle' })
					break
				}

				editor.markHistoryStoppingPoint('create yrkesbarometer shape from search')

				try {
					const shape = createYrkesbarometerShape({
						position: { x: pagePoint.x - 150, y: pagePoint.y - 100 },
						width: 300,
						height: 200,
						data: current.result.item,
					})
					editor.createShapes([shape])
				} catch (error) {
					console.error('Error creating yrkesbarometer shape:', error)
				}

				setDragState({ name: 'idle' })
				break
			}
		}

		removeEventListeners()
	}, [editor, removeEventListeners])

	const handlePointerDown = useCallback((e: React.PointerEvent) => {
		e.preventDefault()
		const target = e.currentTarget as HTMLDivElement
		target.setPointerCapture(e.pointerId)
		targetRef.current = target

		const resultIndex = target.dataset.result_index!
		const index = parseInt(resultIndex, 10)
		
		// Validate index and result
		if (isNaN(index) || index < 0 || index >= searchResults.length) {
			return
		}

		const result = searchResults[index]
		if (!result || !result.item) {
			return
		}

		const startPosition = new Vec(e.clientX, e.clientY)

		setDragState({
			name: 'pointing_item',
			result,
			startPosition,
		})

		target.addEventListener('pointermove', handlePointerMove)
		document.addEventListener('keydown', handleKeyDown)
	}, [searchResults, handlePointerMove, handleKeyDown])

	// Drag preview management using useEffect instead of useQuickReactor
	useEffect(() => {
		const current = dragState
		const imageRef = rDraggingImage.current
		const sidebarContainerRef = rSidebarContainer.current
		
		if (!imageRef || !sidebarContainerRef || !editor) return

		switch (current.name) {
			case 'idle':
			case 'pointing_item': {
				imageRef.style.display = 'none'
				break
			}
			case 'dragging': {
				const sidebarContainerRect = sidebarContainerRef.getBoundingClientRect()
				const box = new Box(
					sidebarContainerRect.x,
					sidebarContainerRect.y,
					sidebarContainerRect.width,
					sidebarContainerRect.height
				)
				const viewportScreenBounds = editor.getViewportScreenBounds()
				if (!viewportScreenBounds) return
				
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
					imageRef.style.zIndex = '100000'
				}
			}
		}
	}, [dragState, editor])

	// Return handlers that gracefully handle missing editor
	const safeHandlePointerDown = useCallback((e: React.PointerEvent) => {
		if (!editor) {
			return
		}
		handlePointerDown(e)
	}, [editor, handlePointerDown])

	const safeHandlePointerUp = useCallback((e: React.PointerEvent) => {
		if (!editor) {
			return
		}
		handlePointerUp(e)
	}, [editor, handlePointerUp])

	return {
		handlePointerDown: safeHandlePointerDown,
		handlePointerUp: safeHandlePointerUp,
		rSidebarContainer,
		rDraggingImage,
		state: dragState
	}
}

// Utility functions for formatting
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

// SearchView Component
interface SearchViewProps {
	searchQuery: string
	setSearchQuery: (query: string) => void
	searchResults: SearchResult[]
	isSearching: boolean
	onBackToMenu: () => void
	onSearch: () => void
	handlePointerDown: (e: React.PointerEvent) => void
	handlePointerUp: (e: React.PointerEvent) => void
	rSidebarContainer: React.RefObject<HTMLDivElement>
}

function SearchView({
	searchQuery,
	setSearchQuery,
	searchResults,
	isSearching,
	onBackToMenu,
	onSearch,
	handlePointerDown,
	handlePointerUp,
	rSidebarContainer
}: SearchViewProps) {
	const inputRef = useRef<HTMLInputElement>(null)

	// Focus the input when the search view opens
	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.focus()
		}
	}, [])

	// Custom pointer down handler for search results that combines drag functionality
	const searchResultPointerDown = (dragHandlePointerDown: (e: React.PointerEvent) => void) => {
		return (e: React.PointerEvent) => {
			e.stopPropagation()
			e.preventDefault()
			dragHandlePointerDown(e)
		}
	}

		return (
		<div 
			className={SIDEBAR_STYLES.container} 
			style={{ pointerEvents: 'all' }}
			onMouseDown={handleMouseDown}
			onWheel={handleWheel}
			onPointerDown={handlePointerDown}
				>
				{/* Header with Back Button */}
			<div className={SIDEBAR_STYLES.header}>
					<button
					onClick={onBackToMenu}
						className="flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-200 mb-2"
					onMouseDown={handleInteractiveMouseDown}
					onPointerDown={handleInteractivePointerDown}
					>
						<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
						</svg>
						Tillbaka
					</button>
					<h2 className="text-base font-bold text-black">Sök prognoser</h2>
				</div>

				{/* Search Section */}
			<div className={SIDEBAR_STYLES.content}>
					<div className="space-y-4">
						{/* Search Input */}
						<div>
							<input
							ref={inputRef}
								type="text"
								placeholder="Sök efter prognoser..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
									onSearch()
									}
								}}
							onMouseDown={handleInteractiveMouseDown}
							onPointerDown={handleInteractivePointerDown}
							/>
						</div>

						{/* Search Button */}
						<button
						onClick={onSearch}
							className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200"
						onMouseDown={handleInteractiveMouseDown}
						onPointerDown={handleInteractivePointerDown}
						>
							Sök
						</button>

						{/* Search Results */}
						{searchQuery && (
							<div className="mt-4">
								<div className="text-xs text-gray-500 mb-2">
									{isSearching ? 'Söker...' : `${searchResults.length} resultat för "${searchQuery}"`}
								</div>
								
								{isSearching ? (
									<div className="flex items-center justify-center py-4">
										<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
									</div>
								) : searchResults.length > 0 ? (
								<div 
									className="space-y-3 max-h-96 overflow-y-auto" 
									ref={rSidebarContainer}
									onMouseDown={handleInteractiveMouseDown}
									onWheel={handleWheel}
									onPointerDown={handleInteractivePointerDown}
								>
									{searchResults.map((result, index) => {
										// Check if result is valid
										const isValid = result && result.item && result.item.yb_yrke && result.item.yrkesomrade
										
										return (
											<div 
												key={index} 
												className={`p-4 rounded-lg text-sm border transition-colors duration-200 select-none ${
													isValid 
														? 'bg-gray-50 border-gray-200 cursor-grab hover:bg-gray-100' 
														: 'bg-red-50 border-red-200 cursor-not-allowed opacity-50'
												}`}
												data-result_index={index}
												onPointerDown={isValid ? searchResultPointerDown(handlePointerDown) : undefined}
												onPointerUp={isValid ? handlePointerUp : undefined}
												title={isValid ? "Dra till canvas för att skapa yrkesbarometer-kort" : "Ogiltigt resultat - kan inte dras"}
											>
												<div className="font-semibold text-gray-800 mb-2 text-base">
													{result.item.yb_yrke}
												</div>
												<div className="text-xs text-gray-600 mb-3">
													{result.item.yrkesomrade}
												</div>
												<div className="space-y-2">
													<div className="flex justify-between items-center">
														<span className="text-xs text-gray-500 font-medium">Möjligheter:</span>
														<span className={`text-xs font-semibold px-2 py-1 rounded ${
															result.item.jobbmojligheter === 'stora' ? 'text-green-700 bg-green-100' :
															result.item.jobbmojligheter === 'medelstora' ? 'text-yellow-700 bg-yellow-100' :
															'text-red-700 bg-red-100'
														}`}>
															{formatJobOpportunities(result.item.jobbmojligheter)}
														</span>
													</div>
													<div className="flex justify-between items-center">
														<span className="text-xs text-gray-500 font-medium">Rekrytering:</span>
														<span className={`text-xs font-semibold px-2 py-1 rounded ${
															result.item.rekryteringssituation === 'brist' ? 'text-red-700 bg-red-100' :
															result.item.rekryteringssituation === 'balans' ? 'text-green-700 bg-green-100' :
															'text-yellow-700 bg-yellow-100'
														}`}>
															{formatRecruitmentSituation(result.item.rekryteringssituation)}
														</span>
													</div>
													<div className="flex justify-between items-center">
														<span className="text-xs text-gray-500 font-medium">Prognos:</span>
														<span className="text-xs font-semibold text-gray-700 px-2 py-1 rounded bg-gray-100">
															{formatPrognosis(result.item.prognos)}
														</span>
													</div>
												</div>
												{result.matchedFields.length > 0 && (
													<div className="mt-3 pt-3 border-t border-gray-200">
														<div className="text-xs text-gray-500">
															<span className="font-medium">Matchade:</span> {result.matchedFields.join(', ')}
														</div>
													</div>
												)}
												<div className="mt-3 text-xs text-gray-400 italic flex items-center">
													<svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
													</svg>
													{isValid ? "Dra till canvas för att skapa kort" : "Ogiltigt resultat"}
												</div>
											</div>
										)
									})}
									</div>
								) : (
									<div className="text-center py-4 text-gray-500 text-sm">
										Inga resultat hittades för "{searchQuery}"
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
	)
}

export function LeftSidebar() {
	const [sidebarState, setSidebarState] = useState<SidebarState>('menu')
	const [searchQuery, setSearchQuery] = useState('')
	const [searchResults, setSearchResults] = useState<SearchResult[]>([])
	const [isSearching, setIsSearching] = useState(false)
	const { logError } = useErrorLogger()
	const renderCountRef = useRef(0)

	// Track render cycles to detect infinite loops
	useEffect(() => {
		renderCountRef.current++
		if (renderCountRef.current > 100) {
			logError(new Error(`LeftSidebar rendered ${renderCountRef.current} times - possible infinite loop`), 'LeftSidebar')
		}
	})

	// Initialize search engine
	const searchEngine = useMemo(() => {
		try {
			return new YrkesbarometerSearch(yrkesbarometerData as YrkesbarometerItem[])
		} catch (error) {
			logError(error as Error, 'LeftSidebar searchEngine initialization')
			return new YrkesbarometerSearch([])
		}
	}, [logError])

	// Use the fixed drag and drop hook
	const { handlePointerDown, handlePointerUp, rSidebarContainer, rDraggingImage, state } = useDragAndDrop(searchResults)

	const handleMenuItemClick = (item: MenuItem) => {
		if (item.disabled) {
			return // Don't handle clicks on disabled items
		}
		
		if (item.id === 'search-forecasts') {
			setSidebarState('search-forecasts')
		}
	}

	const handleBackToMenu = () => {
		setSidebarState('menu')
		setSearchQuery('')
		setSearchResults([])
	}

	const handleSearch = () => {
		if (!searchQuery.trim()) {
			setSearchResults([])
			return
		}

		setIsSearching(true)
		
		// Simulate async search (in real app, this might be an API call)
		setTimeout(() => {
			const results = searchEngine.search(searchQuery, 20)
			setSearchResults(results)
			setIsSearching(false)
		}, 100)
	}

	// Auto-search as user types (debounced)
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			if (searchQuery.trim()) {
				handleSearch()
			} else {
				setSearchResults([])
			}
		}, 300)

		return () => clearTimeout(timeoutId)
	}, [searchQuery])

	// Debug: Log search results when they change
	useEffect(() => {
		if (searchResults.length > 0) {
			// Check for any null/undefined items
			const invalidResults = searchResults.filter((result) => !result || !result.item)
			if (invalidResults.length > 0) {
				// Silently filter out invalid results
				return
			}
		}
	}, [searchResults])

	// Render appropriate view based on state
	if (sidebarState === 'search-forecasts') {
		return (
			<>
				<SearchView
					searchQuery={searchQuery}
					setSearchQuery={setSearchQuery}
					searchResults={searchResults}
					isSearching={isSearching}
					onBackToMenu={handleBackToMenu}
					onSearch={handleSearch}
					handlePointerDown={handlePointerDown}
					handlePointerUp={handlePointerUp}
					rSidebarContainer={rSidebarContainer}
				/>
					<div ref={rDraggingImage}>
						{state.name === 'dragging' && <BarChart3 size={40} />}
					</div>
		</>
	)
	}

	return (
		<MenuView
			menuItems={MENU_ITEMS}
			onMenuItemClick={handleMenuItemClick}
		/>
	)
}
