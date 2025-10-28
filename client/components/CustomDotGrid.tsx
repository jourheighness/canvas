import { useLayoutEffect, useRef } from 'react'
import { useEditor, useValue, useIsDarkMode } from 'tldraw'
import { DOT_GRID_CONFIG } from '../config/dotGridConfig'

// ============================================================================
// Configuration
// ============================================================================

interface CustomDotGridProps {
	size?: number
	dotColor?: string
	dotRadius?: number
}

interface CullLevel {
	minZoom: number
	cullFactor: number
	description: string
}

// Define culling levels for different zoom ranges (must be in descending order)
// More aggressive culling with smoother transitions
// Higher cull factors = less granular snapping when zoomed out
const CULL_LEVELS: CullLevel[] = [
	{ minZoom: 1.0, cullFactor: 1, description: 'Full density' },
	{ minZoom: 0.7, cullFactor: 2, description: 'Every 2nd dot (80px spacing)' },
	{ minZoom: 0.5, cullFactor: 4, description: 'Every 4th dot (160px spacing)' },
	{ minZoom: 0.35, cullFactor: 8, description: 'Every 8th dot (320px spacing)' },
	{ minZoom: 0.15, cullFactor: 16, description: 'Every 16th dot (640px spacing)' },
	{ minZoom: 0.03, cullFactor: Infinity, description: 'No dots' },
]

// ============================================================================
// Utility Functions
// ============================================================================

function getCullFactor(zoom: number): number {
	for (const level of CULL_LEVELS) {
		if (zoom >= level.minZoom) {
			return level.cullFactor
		}
	}
	return Infinity
}

// ============================================================================
// Component
// ============================================================================

export function CustomDotGrid({ 
	size = DOT_GRID_CONFIG.size, 
	dotColor = DOT_GRID_CONFIG.dotColor, 
	dotRadius = DOT_GRID_CONFIG.dotRadius
}: CustomDotGridProps) {
	const editor = useEditor()
	const screenBounds = useValue('screenBounds', () => editor.getViewportScreenBounds(), [])
	const devicePixelRatio = useValue('dpr', () => editor.getInstanceState().devicePixelRatio, [])
	const camera = useValue('camera', () => editor.getCamera(), [])
	const isDarkMode = useIsDarkMode()
	const canvasRef = useRef<HTMLCanvasElement>(null)

	const finalDotColor = isDarkMode ? DOT_GRID_CONFIG.darkMode.dotColor : dotColor

	useLayoutEffect(() => {
		const canvas = canvasRef.current
		const ctx = canvas?.getContext('2d')
		if (!canvas || !ctx) return

		// Setup canvas dimensions
		const width = screenBounds.w * devicePixelRatio
		const height = screenBounds.h * devicePixelRatio
		canvas.width = width
		canvas.height = height

		// Get culling factor based on zoom level
		const cullFactor = getCullFactor(camera.z)
		
		// If no dots should be shown, early return
		if (cullFactor === Infinity) return

		// Calculate world coordinate bounds
		const worldTopLeft = editor.screenToPage({ x: screenBounds.x, y: screenBounds.y })
		const worldBottomRight = editor.screenToPage({ 
			x: screenBounds.x + screenBounds.w, 
			y: screenBounds.y + screenBounds.h 
		})

		// Grid bounds in world space, adjusted for culling to reduce iterations
		const effectiveSize = size * cullFactor
		const startX = Math.floor(worldTopLeft.x / effectiveSize) * effectiveSize
		const startY = Math.floor(worldTopLeft.y / effectiveSize) * effectiveSize
		const endX = Math.ceil(worldBottomRight.x / effectiveSize) * effectiveSize
		const endY = Math.ceil(worldBottomRight.y / effectiveSize) * effectiveSize

		// Pre-calculate constants
		ctx.fillStyle = finalDotColor
		const fixedDotRadius = dotRadius * devicePixelRatio
		const margin = 50
		const minX = screenBounds.x - margin
		const maxX = screenBounds.x + screenBounds.w + margin
		const minY = screenBounds.y - margin
		const maxY = screenBounds.y + screenBounds.h + margin
		const offsetX = screenBounds.x
		const offsetY = screenBounds.y

		// Batch draw operations - iterate only over dots that pass culling
		ctx.beginPath()
		for (let worldX = startX; worldX <= endX; worldX += effectiveSize) {
			for (let worldY = startY; worldY <= endY; worldY += effectiveSize) {
				// Convert to screen coordinates
				const screenPoint = editor.pageToScreen({ x: worldX, y: worldY })
				
				// Quick viewport culling check
				if (screenPoint.x < minX || screenPoint.x > maxX ||
					screenPoint.y < minY || screenPoint.y > maxY) {
					continue
				}

				// Draw dot (batch mode - single beginPath/fill for all dots)
				const screenX = (screenPoint.x - offsetX) * devicePixelRatio
				const screenY = (screenPoint.y - offsetY) * devicePixelRatio
				
				ctx.moveTo(screenX + fixedDotRadius, screenY)
				ctx.arc(screenX, screenY, fixedDotRadius, 0, Math.PI * 2)
			}
		}
		ctx.fill()
	}, [screenBounds, size, dotColor, dotRadius, devicePixelRatio, camera, finalDotColor, editor])

	return (
		<canvas 
			ref={canvasRef} 
			className="tl-grid"
		/>
	)
}
