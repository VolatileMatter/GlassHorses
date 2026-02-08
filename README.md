# GlassHorses - File Structure

## 📁 Project Organization

```
glasshorses/
├── index.html      # Main HTML structure
├── styles.css      # All styling and layout
├── config.js       # API keys and global configuration
├── auth.js         # Authentication (login/logout)
├── gallery.js      # Community gallery functionality
├── drive.js        # Google Drive integration
├── app.js          # Main app initialization
└── README.md       # This file
```

## 📄 File Descriptions

### `index.html`
- Main HTML structure
- Loads all CSS and JavaScript files
- Contains UI elements (navigation, sections, buttons)

### `styles.css`
- All visual styling
- Layout definitions (grid, flexbox)
- Colors, spacing, animations
- Responsive design

### `config.js`
- Supabase configuration (URL, API key)
- Google Drive client ID
- Global state variables
- **Load this first!** (Other scripts depend on it)

### `auth.js`
- User authentication flow
- Google OAuth integration
- Login/logout functions
- Auth state management

### `gallery.js`
- Community gallery display
- Horse card rendering
- Delete functionality
- Database queries for horses

### `drive.js`
- Google Drive API integration
- Folder creation
- File operations (test.md creation)
- Error handling for Drive operations

### `app.js`
- Application initialization
- Initial gallery load
- Entry point for app logic

## 🔧 Load Order (Critical!)

The scripts in `index.html` must load in this order:

1. Supabase CDN
2. Google API script
3. **config.js** (creates `sb` client)
4. **auth.js** (uses `sb`)
5. **gallery.js** (uses `sb`)
6. **drive.js** (uses `sb`, `gapiInited`)
7. **app.js** (calls `loadGallery()`)

## 🚀 Next Steps

To add new features:
- **Game logic**: Create `game.js` for breeding mechanics
- **UI components**: Add to separate files (e.g., `breeding-ui.js`)
- **Data models**: Create `models/` folder for horse DNA structure
- **Utilities**: Add `utils.js` for helper functions

## 🔐 Security Notes

⚠️ **IMPORTANT**: The `supabaseKey` in `config.js` is exposed! This is your **public anon key** - make sure you have Row Level Security (RLS) enabled in Supabase to protect your database.

## 📦 Dependencies

- **Supabase JS**: Database & authentication
- **Google APIs**: Drive integration
- No build tools required - vanilla JavaScript!