# Custom HTML Shapes

## Overview

This directory contains custom tldraw shapes that can embed HTML and React components directly in the canvas.

## HtmlShape

The `HtmlShape` is a custom shape that allows you to embed arbitrary HTML and CSS (and potentially React components) into your tldraw canvas.

### Features

✅ **Full HTML/CSS Support** - Embed any HTML with inline styles  
✅ **Resizable** - Users can resize the shape like any other tldraw shape  
✅ **Moveable** - Drag and position anywhere on the canvas  
✅ **Interactive** - HTML elements (buttons, inputs, etc.) are fully functional  
✅ **Multiplayer Compatible** - Syncs across all connected users  

### Usage

#### Creating from Code

```typescript
import { createHtmlShape } from '../utils/shapeFactory'

// Simple example
createHtmlShape(editor, {
  position: { x: 100, y: 100 },
  width: 300,
  height: 200,
  html: '<div><h1>Hello World!</h1></div>'
})

// Styled example
createHtmlShape(editor, {
  position: { x: 100, y: 100 },
  width: 400,
  height: 300,
  html: `
    <div style="
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    ">
      <h2>My Custom Component</h2>
      <p>With gradients and styling!</p>
      <button onclick="alert('Hello!')">Click Me</button>
    </div>
  `
})
```

#### Creating from Toolbar

You can add a button to the toolbar to create HTML shapes:

```typescript
// In Toolbar.tsx
import { createHtmlShape } from '../utils/shapeFactory'

const handleCreateHtml = () => {
  const editor = window.tldrawEditor
  if (editor) {
    createHtmlShape(editor, {
      position: { x: 200, y: 200 },
      width: 300,
      height: 200,
      html: '<div>Your HTML here</div>'
    })
  }
}
```

### Properties

The HTML shape has the following properties:

```typescript
{
  w: number      // Width in pixels
  h: number      // Height in pixels
  html: string   // The HTML content to render
}
```

### How It Works

1. **Shape Definition** - Defined in `HtmlShape.tsx` using tldraw's `BaseBoxShapeUtil`
2. **Registration** - Registered in `Room.tsx` via `shapeUtils={[HtmlShapeUtil]}`
3. **Rendering** - Uses tldraw's `HTMLContainer` component to render HTML
4. **Synchronization** - Shape data (including HTML) syncs automatically through tldraw's multiplayer system

### Security Note

⚠️ **Important**: The HTML shape uses `dangerouslySetInnerHTML`. Only use with trusted content. For production, you should:

1. Sanitize HTML input (use a library like DOMPurify)
2. Implement Content Security Policy (CSP)
3. Validate and whitelist allowed HTML tags/attributes

### Examples

#### Simple Card

```html
<div style="padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
  <h3>Task Card</h3>
  <p>Complete the project by Friday</p>
</div>
```

#### Interactive Widget

```html
<div style="padding: 15px; background: #f0f0f0; border-radius: 8px;">
  <h4>Counter</h4>
  <button onclick="this.nextElementSibling.textContent = (parseInt(this.nextElementSibling.textContent) + 1)">
    Increment
  </button>
  <span>0</span>
</div>
```

#### Styled Component

```html
<div style="
  padding: 30px;
  background: linear-gradient(to right, #ff6b6b, #ee5a6f);
  color: white;
  border-radius: 12px;
  text-align: center;
  font-family: Arial, sans-serif;
">
  <h2 style="margin: 0 0 10px 0;">Welcome!</h2>
  <p style="margin: 0; opacity: 0.9;">This is a custom HTML component</p>
</div>
```

### Extending to React Components

To use React components instead of plain HTML:

1. Create a React component
2. Use `ReactDOMServer.renderToString()` to convert it to HTML
3. Pass the HTML string to the `html` prop

Example:

```typescript
import ReactDOMServer from 'react-dom/server'

const MyComponent = () => (
  <div style={{ padding: 20, background: '#fff' }}>
    <h3>React Component</h3>
    <p>Rendered as HTML</p>
  </div>
)

createHtmlShape(editor, {
  position: { x: 100, y: 100 },
  width: 300,
  height: 200,
  html: ReactDOMServer.renderToString(<MyComponent />)
})
```

### Future Enhancements

Potential improvements:

- [ ] Live React component rendering (not just static HTML)
- [ ] HTML editing UI
- [ ] Template library
- [ ] HTML sanitization
- [ ] CSS isolation (Shadow DOM)
- [ ] Event handling improvements
- [ ] Props/data binding for dynamic content

