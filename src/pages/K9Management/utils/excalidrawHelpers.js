/**
 * Validate Excalidraw JSON structure
 * @param {Object} json - Parsed JSON object
 * @returns {boolean}
 */
export const validateExcalidrawJson = (json) => {
  if (!json || typeof json !== 'object') return false;
  
  // Excalidraw format: { type: "excalidraw", version: 2, source: "...", elements: [...], ... }
  if (json.type === 'excalidraw' && 
      Array.isArray(json.elements) && 
      json.appState) {
    return true;
  }
  
  // Alternative: Check if it's a valid elements array
  if (Array.isArray(json) && json.length > 0) {
    // Check if first element has Excalidraw element structure
    const firstEl = json[0];
    if (firstEl && 
        (firstEl.type === 'rectangle' || 
         firstEl.type === 'ellipse' || 
         firstEl.type === 'diamond' || 
         firstEl.type === 'arrow' ||
         firstEl.type === 'text' ||
         firstEl.type === 'line' ||
         firstEl.type === 'freedraw')) {
      return true;
    }
  }
  
  // Check if it's an object with elements array
  if (json.elements && Array.isArray(json.elements) && json.elements.length > 0) {
    const firstEl = json.elements[0];
    if (firstEl && firstEl.type) {
      return true;
    }
  }
  
  return false;
};

/**
 * Extract JSON from markdown code block
 * @param {string} text - Text that might contain JSON in code block
 * @returns {Object|null}
 */
export const extractJsonFromMarkdown = (text) => {
  if (!text) return null;
  
  // Try to find JSON in code blocks
  const jsonBlockRegex = /```(?:json)?\s*(\{[\s\S]*\})\s*```/;
  const match = text.match(jsonBlockRegex);
  
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      console.error('Failed to parse JSON from markdown:', e);
    }
  }
  
  // Try to find JSON object directly
  const jsonObjectRegex = /\{[\s\S]*\}/;
  const jsonMatch = text.match(jsonObjectRegex);
  
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('Failed to parse JSON object:', e);
    }
  }
  
  return null;
};

/**
 * Normalize Excalidraw JSON to standard format
 * @param {Object} json - Parsed JSON
 * @returns {Object} - Normalized Excalidraw data
 */
export const normalizeExcalidrawJson = (json) => {
  // If it's already in Excalidraw format, return as is
  if (json.type === 'excalidraw') {
    return json;
  }
  
  // If it's just an elements array, wrap it
  if (Array.isArray(json)) {
    return {
      type: 'excalidraw',
      version: 2,
      source: 'https://excalidraw.com',
      elements: json,
      appState: {
        gridSize: null,
        viewBackgroundColor: '#ffffff'
      },
      files: {}
    };
  }
  
  // If it's an object with elements, ensure it has required fields
  if (json.elements && Array.isArray(json.elements)) {
    return {
      type: 'excalidraw',
      version: json.version || 2,
      source: json.source || 'https://excalidraw.com',
      elements: json.elements,
      appState: json.appState || {
        gridSize: null,
        viewBackgroundColor: '#ffffff'
      },
      files: json.files || {}
    };
  }
  
  return json;
};

