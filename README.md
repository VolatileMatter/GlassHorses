# GlassHorses - Horse Breeding Simulation

A fantasy horse breeding simulator with Google Drive integration for cloud saves and a community gallery for sharing horse creations.

## Project Overview

GlassHorses is a web-based horse breeding game that combines single-player breeding mechanics with community features. Players can breed unique horses, save their progress to Google Drive, and share their creations in a public gallery.

## Current Feature Set

### Authentication System
- Google OAuth login with Drive permissions
- Session persistence across browser restarts
- Automatic token refresh
- Secure logout with cache clearing

### Google Drive Integration
- Automatic creation of hidden save folders in Drive appDataFolder
- Saves game data with timestamps and player information
- Cached initialization for faster subsequent loads
- Background pre-loading after login
- Session-based authentication with Google Drive API

### Community Gallery
- Public display of shared horses
- Horse DNA visualization in JSON format
- Voting system (basic implementation)
- Owner-based deletion (protected by RLS)

## Technical Architecture

### File Structure
```
glasshorses/
├── index.html          # Main HTML structure
├── styles.css          # Fantasy glass unicorn theme styling
├── config.js           # API configuration and global constants
├── auth.js             # Authentication with session management
├── drive.js            # Optimized Google Drive integration
├── gallery.js          # Community gallery functionality
├── app.js              # Main application initialization
├── LICENSE.md          # CC BY-NC 4.0 License
└── README.md           # This documentation
```

### Dependencies
- **Supabase JS v2**: Database and authentication
- **Google APIs**: Drive integration with OAuth
- **Vanilla JavaScript**: No build tools required

## How It Works

### Authentication Flow
1. User clicks "Login with Google"
2. Google OAuth requests permission for Drive access
3. Supabase handles the authentication and stores the session
4. Session persists in localStorage for future visits
5. Drive API is pre-loaded in the background after login

### Drive Integration Process
1. On first use, initializes Google Drive API (2-3 seconds)
2. Creates a hidden "HorseGame" folder in Drive appDataFolder
3. Generates a test.md file with game metadata
4. Caches the initialization for instant future access
5. Background pre-loading reduces wait times for returning users

### Data Flow
1. User data stored in Supabase (authentication, gallery entries)
2. Game saves stored in Google Drive (hidden from user's main Drive view)
3. Community horses stored in Supabase with Row Level Security
4. Session data persists in browser localStorage

## Performance Optimizations

### Drive Loading Optimization
- **Cached Initialization**: First load takes 2-3 seconds, subsequent loads <300ms
- **Background Pre-loading**: Automatically loads Drive API after login
- **Smart Cache Invalidation**: Re-initializes only if cache is older than 5 minutes
- **Promise Caching**: Prevents duplicate initialization requests

### Session Management
- **Auto-restore Sessions**: Users remain logged in across browser sessions
- **Token Refresh**: Automatic refresh of expired tokens
- **Clean Cache Management**: Proper clearing on logout

### User Experience
- **Progressive Loading**: Shows step-by-step progress for Drive operations
- **Error Recovery**: Graceful handling of network issues and token expiration
- **Offline Detection**: User-friendly messages for connection problems

## Security Implementation

### Data Protection
- Row Level Security (RLS) in Supabase protects user data
- Google Drive appDataFolder keeps saves hidden from users
- OAuth tokens never stored directly, only via Supabase session
- Session data encrypted in browser storage

### API Security
- Supabase public key exposed but protected by RLS policies
- Google Drive access requires explicit user consent
- All API calls include proper error handling and validation

## Setup Instructions

### Prerequisites
1. Google Cloud Project with Drive API enabled
2. Supabase project with authentication configured
3. OAuth consent screen configured for Google Cloud

### Configuration Steps
1. Replace `supabaseKey` in `config.js` with your project's anon key
2. Update `CLIENT_ID` with your Google Cloud OAuth client ID
3. Enable Row Level Security on all Supabase tables
4. Configure Google OAuth in Supabase authentication settings

### Testing
1. Open index.html in a modern browser
2. Click "Login with Google" and grant Drive permissions
3. Test Drive integration with the "Test Drive Save" button
4. Verify gallery loads with sample data

## Current Limitations

### Known Issues
- Drive initialization requires active internet connection
- Session restoration may fail if tokens are severely expired
- Gallery functionality depends on Supabase table structure
- No actual horse breeding mechanics implemented yet

### Browser Support
- Modern browsers with ES6 support
- Requires localStorage and Promise support
- Google Drive API requires secure contexts (HTTPS)

## Next Development Phase

### Planned Features
1. Horse DNA generation and breeding algorithms
2. Visual horse representation based on DNA
3. Local save/load functionality as fallback
4. Advanced gallery features (search, filtering, sorting)
5. Player inventory and economy system

### Technical Improvements
1. Service Worker for offline capability
2. IndexedDB for local game state
3. WebSocket for real-time gallery updates
4. Progressive Web App (PWA) installation

## Troubleshooting

### Common Issues

**Drive not loading:**
- Check console for authentication errors
- Verify Google Cloud OAuth consent screen is configured
- Ensure Drive API is enabled in Google Cloud Console

**Session not persisting:**
- Check browser localStorage is not blocked
- Verify Supabase auth configuration
- Clear browser cache and retry

**Gallery not loading:**
- Check Supabase table structure matches expectations
- Verify RLS policies allow public read access
- Check network console for API errors

### Debug Mode
Open browser console (F12) to see detailed logs:
- App initialization status
- Authentication events
- Drive API loading progress
- Error details for troubleshooting

## License

This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License. See LICENSE.md for details.

## Acknowledgments

- Supabase for backend infrastructure
- Google Drive API for cloud storage
- Community gallery concept inspired by breeding simulation games

---

*Note: This is a work in progress. Features and architecture may change as development continues.*