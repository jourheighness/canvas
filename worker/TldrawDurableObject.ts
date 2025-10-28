import { RoomSnapshot, TLSocketRoom } from '@tldraw/sync-core'
import {
	TLRecord,
	createTLSchema,
	defaultBindingSchemas,
	defaultShapeSchemas,
} from '@tldraw/tlschema'
import { AutoRouter, IRequest, error } from 'itty-router'
import throttle from 'lodash.throttle'

const schema = createTLSchema({
	shapes: { ...defaultShapeSchemas },
	bindings: { ...defaultBindingSchemas },
})

export class TldrawDurableObject {
	private r2: R2Bucket
	private roomId: string | null = null
	private roomPromise: Promise<TLSocketRoom<TLRecord, void>> | null = null

	constructor(
		private readonly ctx: DurableObjectState,
		env: Env
	) {
		this.r2 = env.TLDRAW_BUCKET

		ctx.blockConcurrencyWhile(async () => {
			this.roomId = ((await this.ctx.storage.get('roomId')) ?? null) as string | null
		})
	}

	private readonly router = AutoRouter({
		catch: (e) => {
			console.log('Router error:', e)
			return error(e)
		},
	})
		.get('/api/connect/:roomId', async (request) => {
			if (!this.roomId) {
				await this.ctx.blockConcurrencyWhile(async () => {
					await this.ctx.storage.put('roomId', request.params.roomId)
					this.roomId = request.params.roomId
				})
			}
			return this.handleConnect(request)
		})
		.post('/api/log-error', async (request) => {
			try {
				const errorData = await request.json() as {
					error: string
					stack: string
					context: string
					timestamp: string
					userAgent: string
					url: string
				}
				console.log('Client error logged:', {
					error: errorData.error,
					stack: errorData.stack,
					context: errorData.context,
					timestamp: errorData.timestamp,
					userAgent: errorData.userAgent,
					url: errorData.url,
					roomId: this.roomId,
					loggedAt: new Date().toISOString()
				})
				return new Response('OK', { status: 200 })
			} catch (e) {
				console.error('Failed to log client error:', e)
				return new Response('Error', { status: 500 })
			}
		})

	fetch(request: Request): Response | Promise<Response> {
		return this.router.fetch(request)
	}

	async handleConnect(request: IRequest) {
		const sessionId = request.query.sessionId as string
		if (!sessionId) return error(400, 'Missing sessionId')

		const { 0: clientWebSocket, 1: serverWebSocket } = new WebSocketPair()
		serverWebSocket.accept()

		const room = await this.getRoom()
		room.handleSocketConnect({ sessionId, socket: serverWebSocket })

		return new Response(null, { status: 101, webSocket: clientWebSocket })
	}

	getRoom() {
		const roomId = this.roomId
		if (!roomId) throw new Error('Missing roomId')

		if (!this.roomPromise) {
			this.roomPromise = (async () => {
				const roomFromBucket = await this.r2.get(`rooms/${roomId}`)
				const initialSnapshot = roomFromBucket
					? ((await roomFromBucket.json()) as RoomSnapshot)
					: undefined

				return new TLSocketRoom<TLRecord, void>({
					schema,
					initialSnapshot,
					onDataChange: () => {
						this.schedulePersistToR2()
					},
				})
			})()
		}

		return this.roomPromise
	}

	schedulePersistToR2 = throttle(async () => {
		if (!this.roomPromise || !this.roomId) return
		const room = await this.getRoom()
		const snapshot = JSON.stringify(room.getCurrentSnapshot())
		await this.r2.put(`rooms/${this.roomId}`, snapshot)
	}, 10_000)
}
