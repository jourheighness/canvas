interface ChecklistProps {
	position: { x: number; y: number }
	width?: number
	height?: number
	title?: string
	items?: string[]
	checkedItems?: boolean[]
}

export function createChecklistShape({ 
	position, 
	width = 300, 
	height = 200, 
	title = 'Checklista',
	items = ['Uppgift 1', 'Uppgift 2'],
	checkedItems = [false, false, false]
}: ChecklistProps) {
	return {
		type: 'checklist' as const,
		x: position.x,
		y: position.y,
		props: {
			w: width,
			h: height,
			title,
			items,
			checkedItems,
		},
	}
}
