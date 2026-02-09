# John Deere Operations Center Integration

Connect farm_clawed to John Deere Operations Center to import your fields, boundaries, and operations data.

## Overview

The John Deere connector uses OAuth2 to securely access your Deere account. Your credentials are stored locally and never in the codebase.

## Prerequisites

1. A John Deere Operations Center account
2. A registered application at [developer.deere.com](https://developer.deere.com)

## Setup Steps

### 1. Register Your Application

1. Go to [developer.deere.com](https://developer.deere.com)
2. Create a new application
3. Note your **Client ID** and **Client Secret**
4. Set the **Redirect URI** to:
   ```
   http://localhost:18789/oauth/deere/callback
   ```

### 2. Configure Environment Variables

Add the following to your `.env` file:

```bash
DEERE_CLIENT_ID=your_client_id_here
DEERE_CLIENT_SECRET=your_client_secret_here
DEERE_REDIRECT_URI=http://localhost:18789/oauth/deere/callback
```

> **Security Note**: Never commit your `.env` file. It should be listed in `.gitignore`.

### 3. Connect in farm_clawed

1. Open farm_clawed and go to **Setup**
2. In Step 3 (Data Sources), select **John Deere Operations Center**
3. Click **Connect** and follow the OAuth flow
4. Authorize farm_clawed to access your Deere account

## Available Data

Once connected, farm_clawed can access:

- **Organizations** - Your farm operations
- **Fields** - Field boundaries and metadata
- **Operations** - Planting, application, and harvest data (depending on your API permissions)

## API Reference

The connector uses John Deere's Field Operations APIs:

- [Organizations API](https://developer.deere.com/#/apis/organizations)
- [Fields API](https://developer.deere.com/#/apis/fields)
- [Field Operations API](https://developer.deere.com/#/apis/field-operations)

## Token Management

- Access tokens are automatically refreshed when expired
- Tokens are stored locally in `~/.farm_clawed/fmis_cache/`
- You can disconnect at any time from the Setup tab

## Troubleshooting

### "Invalid state parameter" Error

This usually means the authorization session expired. Start the connection process again.

### "Token refresh failed" Error

Your refresh token may have expired (typically after 180 days of inactivity). Reconnect your account.

### API Permission Errors

Some APIs require specific permissions. Contact Deere support if you need access to additional data.

## Data Privacy

- farm_clawed only reads data from your Deere account
- No data is written back to Deere
- Your credentials are stored locally, never transmitted except to Deere's OAuth servers
- You can revoke access at any time through your Deere account settings

