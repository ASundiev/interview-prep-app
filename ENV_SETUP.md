# Environment Variables Setup

This guide explains how to configure environment variables for both local development and production deployment.

## Required Environment Variables

### `OPENAI_API_KEY` (Required)
Your OpenAI API key for document parsing, interview analysis, and realtime conversations.
- Get your key from: https://platform.openai.com/api-keys

## Optional Environment Variables

### Synthesia (Optional - app works without it)
- `SYNTHESIA_API_KEY` - Synthesia API key for video briefing generation
- `SYNTHESIA_DEFAULT_AVATAR` - Default avatar ID
- `SYNTHESIA_DEFAULT_BACKGROUND` - Default background ID
- `SYNTHESIA_TEST_MODE` - Set to `"true"` for test mode

### Customization (Optional)
- `NEXT_PUBLIC_PREFERRED_AVATAR_ID` - Avatar ID for the interview
- `NEXT_PUBLIC_PREFERRED_AVATAR_NAME` - Display name for the AI interviewer
- `NEXT_PUBLIC_OPENAI_REALTIME_MODEL` - OpenAI Realtime model to use

## Local Development Setup

1. Create a `.env.local` file in the root directory:
```bash
OPENAI_API_KEY=sk-your-actual-api-key-here
```

2. The `.env.local` file is already in `.gitignore` and will not be committed.

3. Restart your development server after adding environment variables:
```bash
npm run dev
```

## Production Deployment (Vercel)

### Setting Environment Variables in Vercel

1. Go to your project on [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Settings** → **Environment Variables**
3. Add your environment variables:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key
   - **Environment**: Select `Production`, `Preview`, and/or `Development` as needed
4. Click **Save**
5. Redeploy your application for changes to take effect

### Environment-Specific Variables

You can set different values for different environments:
- **Production**: Used for production deployments
- **Preview**: Used for preview deployments (pull requests)
- **Development**: Used for Vercel CLI deployments

## Alternative: GitHub Secrets (for CI/CD)

If you're using GitHub Actions, you can set secrets at:
1. Repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add `OPENAI_API_KEY` with your API key value

## Security Best Practices

✅ **DO:**
- Use repository-level secrets for production
- Keep `.env.local` in `.gitignore` (already configured)
- Use different API keys for development and production
- Rotate API keys regularly

❌ **DON'T:**
- Commit `.env.local` or any `.env*` files
- Share API keys in code, issues, or pull requests
- Use production keys in local development

## Verifying Your Setup

After setting up environment variables:

1. **Local**: Check that `process.env.OPENAI_API_KEY` is available in your API routes
2. **Production**: Check Vercel deployment logs to ensure variables are loaded
3. **Test**: Try the "Start Interview" flow to verify everything works

## Troubleshooting

### "Missing credentials" error
- Ensure `OPENAI_API_KEY` is set in your environment
- Restart your dev server after adding `.env.local`
- Check that the variable name is exactly `OPENAI_API_KEY` (case-sensitive)

### Variables not loading in production
- Verify variables are set in Vercel dashboard
- Ensure you've selected the correct environment (Production/Preview)
- Redeploy your application after adding variables
