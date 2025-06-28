# Blue Sky Weekly Likes Email

This project automatically sends you a weekly email containing all your Blue Sky likes from the past week, including text content and links to any images or videos.

## Setup Instructions

### 1. Fork this repository to your GitHub account

### 2. Set up Blue Sky credentials
- You'll need your Blue Sky username/handle and password
- Note: You may want to create an app-specific password if Blue Sky supports it

### 3. Set up email credentials
For Gmail (recommended):
- Enable 2-factor authentication on your Google account
- Generate an app-specific password:
  1. Go to Google Account settings
  2. Security → 2-Step Verification → App passwords
  3. Generate a new app password for this script

### 4. Configure GitHub Secrets
Go to your forked repository → Settings → Secrets and variables → Actions

Add these repository secrets:

- `BLUESKY_IDENTIFIER`: Your Blue Sky handle (e.g., yourname.bsky.social)
- `BLUESKY_PASSWORD`: Your Blue Sky password
- `EMAIL_USER`: Your Gmail address
- `EMAIL_PASS`: Your Gmail app password
- `EMAIL_TO`: The email address to send the weekly digest to
- `EMAIL_FROM`: The email address to send from (usually same as EMAIL_USER)

### 5. Enable GitHub Actions
- Go to the Actions tab in your repository
- Enable workflows if they're not already enabled

### 6. Test the workflow
- Go to Actions → Weekly Blue Sky Likes Email
- Click "Run workflow" to test it manually
- Check your email for the weekly digest

## How it works

- **Schedule**: Runs every Sunday at 9:00 AM UTC
- **Data**: Fetches all your likes from the past 7 days
- **Content**: Includes post text, author info, images, videos, and links
- **Email**: Sends a formatted HTML email with all the content

## Customization

You can modify the schedule by editing `.github/workflows/weekly-bluesky-likes.yml`:

```yaml
schedule:
  # Run daily at 8 AM UTC
  - cron: '0 8 * * *'
  
  # Run twice a week (Wednesday and Sunday at 9 AM UTC)
  - cron: '0 9 * * 0,3'
```

You can also modify the email formatting by editing `scripts/fetch-bluesky-likes.js`.

## Security Notes

- Never commit your credentials to the repository
- Use GitHub Secrets for all sensitive information
- Consider using app-specific passwords where available
- The script only reads your likes; it doesn't post or modify anything

## Troubleshooting

### Common issues:

1. **Authentication failed**: Check your Blue Sky credentials
2. **Email not sending**: Verify your Gmail app password and settings
3. **No likes found**: The script looks for likes in the past 7 days
4. **Workflow not running**: Check that GitHub Actions are enabled

### View logs:
- Go to Actions tab → Select the workflow run → View job details

## Privacy

This script:
- Only accesses your own Blue Sky likes
- Runs on GitHub's servers
- Only sends emails to addresses you specify
- Does not store or share your data with third parties