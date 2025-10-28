import React from 'react'

interface ErrorBoundaryState {
	hasError: boolean
	error?: Error
	errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
	children: React.ReactNode
	fallback?: React.ComponentType<{ error: Error; errorInfo: React.ErrorInfo }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props)
		this.state = { hasError: false }
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error }
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error('ErrorBoundary caught an error:', error, errorInfo)
		
		// Log to Cloudflare Workers if available
		if (typeof window !== 'undefined' && (window as any).cloudflare) {
			try {
				(window as any).cloudflare.log('ErrorBoundary Error:', {
					error: error.message,
					stack: error.stack,
					componentStack: errorInfo.componentStack
				})
			} catch (e) {
				console.error('Failed to log to Cloudflare:', e)
			}
		}

		this.setState({
			error,
			errorInfo
		})
	}

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				const FallbackComponent = this.props.fallback
				return <FallbackComponent error={this.state.error!} errorInfo={this.state.errorInfo!} />
			}

			return (
				<div style={{ 
					padding: '20px', 
					border: '2px solid #ff6b6b', 
					borderRadius: '8px', 
					backgroundColor: '#ffe0e0',
					margin: '20px',
					fontFamily: 'monospace'
				}}>
					<h2 style={{ color: '#d63031', margin: '0 0 10px 0' }}>Something went wrong</h2>
					<p style={{ margin: '0 0 10px 0' }}>Error: {this.state.error?.message}</p>
					<details style={{ marginTop: '10px' }}>
						<summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Error Details</summary>
						<pre style={{ 
							backgroundColor: '#f8f9fa', 
							padding: '10px', 
							borderRadius: '4px',
							overflow: 'auto',
							fontSize: '12px',
							marginTop: '10px'
						}}>
							{this.state.error?.stack}
						</pre>
						<pre style={{ 
							backgroundColor: '#f8f9fa', 
							padding: '10px', 
							borderRadius: '4px',
							overflow: 'auto',
							fontSize: '12px',
							marginTop: '10px'
						}}>
							{this.state.errorInfo?.componentStack}
						</pre>
					</details>
					<button 
						onClick={() => window.location.reload()} 
						style={{
							marginTop: '10px',
							padding: '8px 16px',
							backgroundColor: '#74b9ff',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer'
						}}
					>
						Reload Page
					</button>
				</div>
			)
		}

		return this.props.children
	}
}

// Hook for logging errors
export const useErrorLogger = () => {
	const logError = React.useCallback((error: Error, context?: string) => {
		console.error(`Error in ${context || 'unknown context'}:`, error)
		
		// Try to send to Cloudflare Workers
		if (typeof window !== 'undefined') {
			try {
				fetch('/api/log-error', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						error: error.message,
						stack: error.stack,
						context,
						timestamp: new Date().toISOString(),
						userAgent: navigator.userAgent,
						url: window.location.href
					})
				}).catch(e => console.error('Failed to send error log:', e))
			} catch (e) {
				console.error('Failed to log error:', e)
			}
		}
	}, [])

	return { logError }
}
