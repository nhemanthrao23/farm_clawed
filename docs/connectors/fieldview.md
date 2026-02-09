# Climate FieldView Integration

Connect farm_clawed to Climate FieldView to import your field boundaries and data.

## Overview

The Climate FieldView connector uses OAuth2 to securely access your FieldView account. Your credentials are stored locally and never in the codebase.

## Prerequisites

1. A Climate FieldView account
2. A registered application at [developer.climate.com](https://developer.climate.com)

## Setup Steps

### 1. Register Your Application

1. Go to [developer.climate.com](https://developer.climate.com)
2. Create a developer account if you don't have one
3. Register a new application
4. Note your **Client ID** and **Client Secret**
5. Set the **Redirect URI** to:
   ```
   http://localhost:18789/oauth/fieldview/callback
   ```

### 2. Configure Environment Variables

Add the following to your `.env` file:

```bash
FIELDVIEW_CLIENT_ID=your_client_id_here
FIELDVIEW_CLIENT_SECRET=your_client_secret_here
FIELDVIEW_REDIRECT_URI=http://localhost:18789/oauth/fieldview/callback
```

> **Security Note**: Never commit your `.env` file. It should be listed in `.gitignore`.

### 3. Connect in farm_clawed

1. Open farm_clawed and go to **Setup**
2. In Step 3 (Data Sources), select **Climate FieldView**
3. Click **Connect** and follow the OAuth flow
4. Authorize farm_clawed to access your FieldView account

## Available Data

Once connected, farm_clawed can access:

- **Farms** - Your farm locations
- **Fields** - Field boundaries and acreage
- **Additional data** depends on your API permissions and subscription level

## API Reference

The connector uses Climate FieldView's Platform APIs:

- [Fields API](https://developer.climate.com/docs/fields)
- [Farms API](https://developer.climate.com/docs/farms)

## Token Management

- Access tokens are automatically refreshed when expired
- Tokens are stored locally in `~/.farm_clawed/fmis_cache/`
- You can disconnect at any time from the Setup tab

## Troubleshooting

### "Invalid state parameter" Error

This usually means the authorization session expired. Start the connection process again.

### "Token refresh failed" Error

Your refresh token may have expired. Reconnect your account.

### API Rate Limits

FieldView has API rate limits. If you're making many requests, you may need to wait before retrying.

## Data Privacy

- farm_clawed only reads data from your FieldView account
- No data is written back to FieldView
- Your credentials are stored locally, never transmitted except to Climate's OAuth servers
- You can revoke access at any time through your FieldView account settings

