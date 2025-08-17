# Mirror Wars Deployment Guide

## Deploy to Render

1. **Push to GitHub** (already done):
   ```bash
   git add .
   git commit -m "Add server infrastructure for multiplayer"
   git push origin main
   ```

2. **Deploy on Render**:
   - Go to [render.com](https://render.com)
   - Sign up/in with GitHub
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `jaibhedia/mirror-wars`
   - Configure:
     - **Name**: `mirror-wars-game`
     - **Runtime**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Instance Type**: `Free` (or paid for better performance)
   - Click "Create Web Service"

3. **Environment Variables** (if needed):
   - None required for basic setup
   - For production, you might want to add:
     - `NODE_ENV=production`

4. **Custom Domain** (optional):
   - After deployment, you can add a custom domain in settings

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or start production server
npm start
```

## How It Works

- **Frontend**: Served as static files by Express
- **Backend**: Node.js + Express + Socket.IO
- **Real-time**: Socket.IO handles multiplayer communication
- **Storage**: In-memory (rooms reset on server restart)

## Production Considerations

For a production app, consider:

1. **Database**: Add Redis or MongoDB for persistent room storage
2. **Scaling**: Use Redis adapter for Socket.IO clustering
3. **Security**: Add rate limiting, input validation
4. **Monitoring**: Add error tracking (Sentry, etc.)

## Troubleshooting

- **"Room not found"**: Rooms are temporary and reset on server restart
- **Connection issues**: Check browser console for socket errors
- **Deploy fails**: Check build logs in Render dashboard
