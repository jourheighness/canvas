import { useCallback, useLayoutEffect, useRef } from 'react'
import {
	AtomMap,
	EditorAtom,
	TLShapeId,
	useEditor,
} from 'tldraw'

// Global atom to store shape sizes measured from DOM
export const ShapeSizes = new EditorAtom('shape sizes', (editor) => {
	const map = new AtomMap<TLShapeId, { width: number; height: number }>('shape sizes')

	// Clean up sizes when shapes are deleted
	editor.sideEffects.registerAfterDeleteHandler('shape', (shape) => {
		map.delete(shape.id)
	})

	return map
})

// Hook to measure DOM element and update shape size
export function useDynamicShapeSize(shapeId: TLShapeId) {
	const ref = useRef<HTMLDivElement>(null)
	const editor = useEditor()

	const updateShapeSize = useCallback(() => {
		if (!ref.current) return

		// Get actual DOM dimensions
		const width = ref.current.offsetWidth
		const height = ref.current.offsetHeight

		// Update the shape size in our global atom
		ShapeSizes.update(editor, (map) => {
			const existing = map.get(shapeId)
			if (existing && existing.width === width && existing.height === height) return map
			return map.set(shapeId, { width, height })
		})
	}, [editor, shapeId])

	// Update size immediately on render
	useLayoutEffect(() => {
		updateShapeSize()
	})

	// Watch for DOM size changes using ResizeObserver
	useLayoutEffect(() => {
		if (!ref.current) return
		const observer = new ResizeObserver(updateShapeSize)
		observer.observe(ref.current)
		return () => {
			observer.disconnect()
		}
	}, [updateShapeSize])

	return ref
}
