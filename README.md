# ClipSync - Cross-Device Clipboard Manager

A Chrome Extension that syncs your clipboard across devices using Firebase Realtime Database and a "Secret Room ID" system.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Configure Firebase:

   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Realtime Database
   - Copy your Firebase config and paste it in `src/firebase.js`

3. Build the extension:

```bash
npm run build
```

4. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

### Development

Run the development server:

```bash
npm run dev
```

## 📁 Project Structure

```
ClipSync-Extension/
├── dist/                  # Built extension (after npm run build)
├── icons/                 # Extension icons (16x16, 48x48, 128x128)
├── src/
│   ├── App.jsx           # Main React component
│   ├── firebase.js       # Firebase configuration
│   ├── index.css         # Tailwind CSS styles
│   └── main.jsx          # React entry point
├── index.html            # Extension popup HTML
├── manifest.json         # Chrome Extension manifest (V3)
├── package.json          # Dependencies
├── postcss.config.js     # PostCSS config
├── tailwind.config.js    # Tailwind CSS config
└── vite.config.js        # Vite build config
```

## 🎨 Features

- **Secret Room ID**: Connect devices using a shared secret room
- **Clipboard Sync**: One-click sync of current clipboard content
- **Sync History**: View and manage previously synced clips
- **Online Status**: Visual indicator showing connection status
- **Clean UI**: Singapore-inspired blue and white color palette

## 📝 Adding Icons

Add your extension icons to the `icons/` folder:

- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

## 🔥 Firebase Setup

Replace the placeholder values in `src/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

## 📄 License

MIT
