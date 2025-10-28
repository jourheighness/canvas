import { T } from '@tldraw/tlschema'

export const checklistShapeProps = {
	w: T.number,
	h: T.number,
	title: T.string,
	items: T.arrayOf(T.string),
	checkedItems: T.arrayOf(T.boolean),
}

export const htmlShapeProps = {
	w: T.number,
	h: T.number,
	html: T.string,
}
