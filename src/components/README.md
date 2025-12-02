# Components

This directory contains reusable React components.

## FirstTimePopup

A popup component that appears when users navigate to `/home` for the first time.

### Features

- **First-time detection**: Only shows for users who haven't seen it before
- **Dismissible**: Users can close the popup by clicking the close button or outside the modal
- **"Don't show again" option**: Checkbox to prevent the popup from appearing in future visits
- **Local storage persistence**: Uses localStorage to remember user preference
- **Responsive design**: Works on both desktop and mobile devices
- **Custom styling**: Uses CSS modules with Ant Design theme integration

### Usage

```jsx
import FirstTimePopup from '../../components/FirstTimePopup.jsx';

// In your component
const [showFirstTimePopup, setShowFirstTimePopup] = useState(false);

// Check if popup should be shown
useEffect(() => {
  const hasSeenPopup = localStorage.getItem('firstTimeHomePopup');
  if (!hasSeenPopup) {
    setShowFirstTimePopup(true);
  }
}, []);

// Render the popup
<FirstTimePopup 
  visible={showFirstTimePopup} 
  onClose={() => setShowFirstTimePopup(false)} 
/>
```

### Props

- `visible` (boolean): Controls whether the popup is shown
- `onClose` (function): Callback function called when the popup is closed

### Local Storage Key

The component uses the localStorage key `firstTimeHomePopup` to track whether the user has seen the popup.

### Styling

The component uses CSS modules (`FirstTimePopup.module.css`) with custom styling that integrates with the Ant Design theme. The popup features:

- Gradient header with the brand color (#b1143c)
- Centered content with logo image
- Welcome message and description
- Checkbox for "don't show again" option
- Responsive design for mobile and desktop

### Image

The popup displays the `/Logo.png` image from the public folder. Make sure this image exists for proper display.
