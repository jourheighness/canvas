interface PostItProps {
	position: { x: number; y: number }
	color?: string
	size?: string
	font?: string
}

export function createPostItShape({ position, color = 'grey', size = 'm', font = 'draw' }: PostItProps) {
	return {
		type: 'note' as const,
		x: position.x,
		y: position.y,
		props: {
			color,
			size,
			font,
		},
	}
}
