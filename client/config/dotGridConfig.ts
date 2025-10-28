// Custom Dot Grid Configuration
// Modify these values to change the appearance of your dot grid

export const DOT_GRID_CONFIG = {
	// Spacing between dots in pixels (larger = less granular snapping)
	size: 40,
	
	// Color of the dots (supports any CSS color)
	dotColor: '#dddddd', // Light grey
	
	// Radius of each dot in pixels
	dotRadius: 1.5,
	
	// Dark mode configuration
	darkMode: {
		dotColor: '#ffffff', // White
		size: 40,
		dotRadius: 1.5,
	}
}

// Helper function to get current theme configuration
export function getDotGridConfig(isDarkMode: boolean = false) {
	if (isDarkMode) {
		return {
			size: DOT_GRID_CONFIG.darkMode.size,
			dotColor: DOT_GRID_CONFIG.darkMode.dotColor,
			dotRadius: DOT_GRID_CONFIG.darkMode.dotRadius,
		}
	}
	
	return {
		size: DOT_GRID_CONFIG.size,
		dotColor: DOT_GRID_CONFIG.dotColor,
		dotRadius: DOT_GRID_CONFIG.dotRadius,
	}
}
