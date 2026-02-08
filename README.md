# GlassHorses - Horse Breeding Simulation

A fantasy horse breeding simulator with Google Drive integration for cloud saves and a community gallery for sharing horse creations. Hosted on Vercel for seamless deployment and scalability.

## Project Overview

GlassHorses is a web-based horse breeding game that combines single-player breeding mechanics with community features. Players can breed unique horses, save their progress to Google Drive, and share their creations in a public gallery. The application is deployed on Vercel for automatic deployments and global CDN distribution.

## Hosting Information

### Vercel Deployment
- **Platform**: Vercel (Serverless deployment)
- **URL**: https://glasshorses-vercel.vercel.app
- **Deployment**: Automatic from GitHub repository
- **Features**: Global CDN, automatic SSL, serverless functions ready

### Deployment Configuration
- **Framework**: Static HTML/JS (no build step required)
- **Root Directory**: Project root
- **Build Command**: None (static files)
- **Output Directory**: Not applicable (static deployment)

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
- **Vercel**: Hosting and deployment platform

### Vercel-Specific Configuration
- No `vercel.json` required (automatic static detection)
- CORS headers automatically configured for APIs
- Environment variables managed in Vercel dashboard
- Automatic HTTPS/SSL provisioning

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

### Vercel Hosting Benefits
- **Global CDN**: Files served from edge locations worldwide
- **Automatic Compression**: Assets optimized for fast delivery
- **HTTP/2 Support**: Improved loading performance
- **Cache Headers**: Static files cached appropriately

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

### Vercel Security Features
- **Automatic HTTPS**: All traffic encrypted
- **DDoS Protection**: Built-in mitigation
- **Security Headers**: Automatic security headers
- **Isolated Deployments**: Each deployment isolated

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

### Local Development
1. Clone the repository
2. Open `index.html` in a modern browser
3. Update API keys in `config.js` for local testing
4. No build process required

### Vercel Deployment
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard:
   - `SUPABASE_URL` (if using serverless functions)
   - `SUPABASE_ANON_KEY` (if using serverless functions)
4. Deploy automatically or manually

### Prerequisites
1. Google Cloud Project with Drive API enabled
2. Supabase project with authentication configured
3. OAuth consent screen configured for Google Cloud
4. Vercel account (free tier available)

### Configuration Steps
1. Replace `supabaseKey` in `config.js` with your project's anon key
2. Update `CLIENT_ID` with your Google Cloud OAuth client ID
3. Enable Row Level Security on all Supabase tables
4. Configure Google OAuth in Supabase authentication settings
5. Add domain to Google OAuth authorized redirect URIs (Vercel URL)

### Testing
1. Open deployed Vercel URL in a modern browser
2. Click "Login with Google" and grant Drive permissions
3. Test Drive integration with the "Test Drive Save" button
4. Verify gallery loads with sample data

## Vercel-Specific Considerations

### CORS Configuration
- Google Drive API requires proper CORS configuration
- Supabase requests need appropriate CORS headers
- Vercel automatically handles basic CORS for static files

### Environment Variables
For enhanced security in production:
1. Store sensitive keys in Vercel environment variables
2. Update `config.js` to read from `process.env` if using build step
3. Consider using Vercel serverless functions as API proxy

### Custom Domains
1. Add custom domain in Vercel dashboard
2. Update Google OAuth authorized redirect URIs
3. Update Supabase redirect URLs if configured

## Current Limitations

### Known Issues
- Drive initialization requires active internet connection
- Session restoration may fail if tokens are severely expired
- Gallery functionality depends on Supabase table structure
- No actual horse breeding mechanics implemented yet
- Static deployment means API keys are exposed in client-side code

### Browser Support
- Modern browsers with ES6 support
- Requires localStorage and Promise support
- Google Drive API requires secure contexts (HTTPS)
- Vercel provides automatic HTTPS

## Next Development Phase

### Vercel-Specific Improvements
1. Implement serverless functions for sensitive operations
2. Add API routes for secure key management
3. Implement edge caching for gallery data
4. Add analytics with Vercel Analytics

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
- Check Vercel deployment URL is in authorized domains

**Session not persisting:**
- Check browser localStorage is not blocked
- Verify Supabase auth configuration
- Clear browser cache and retry
- Check domain matches between local and deployed versions

**Gallery not loading:**
- Check Supabase table structure matches expectations
- Verify RLS policies allow public read access
- Check network console for API errors
- Verify Supabase project is accessible from Vercel domain

**Vercel deployment issues:**
- Check Vercel deployment logs
- Verify all files are included in deployment
- Check environment variables if using serverless functions
- Verify custom domain DNS settings if applicable

### Debug Mode
Open browser console (F12) to see detailed logs:
- App initialization status
- Authentication events
- Drive API loading progress
- Error details for troubleshooting
- Network requests to verify API connectivity

## License

This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License. See LICENSE.md for details.

## Acknowledgments

- **Vercel** for hosting and deployment platform
- **Supabase** for backend infrastructure
- **Google Drive API** for cloud storage
- Community gallery concept inspired by breeding simulation games

*Note: This is a work in progress. Features and architecture may change as development continues. The current deployment exposes API keys client-side; for production use, consider implementing serverless functions or environment variable management.*