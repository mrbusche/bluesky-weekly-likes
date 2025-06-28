# Blue Sky Weekly Likes Email

This project automatically sends you a weekly email containing all your Blue Sky likes from the past week, including text content and links to any images or videos.

For accessibility purposes there is an HTML and text version of the generated email .

## Setup Instructions

### 1. Fork this repository to your GitHub account

### 2. Set up Blue Sky credentials
- You'll need your Blue Sky username/handle and password
- Note: You will want to create an app-specific password for Blue Sky

### 3. Set up email credentials
For Gmail (recommended):
- Generate an app-specific password:
  1. Go to Google Account settings
  2. Security → 2-Step Verification → App passwords
  3. Generate a new app password for this script

### 4. Configure GitHub Secrets
Go to your forked repository → Settings → Secrets and variables → Actions

Add these repository secrets:

- `EMAIL_USER`: your gmail address
- `EMAIL_PASS`: your gmail app password
- `RECIPIENT_EMAILS`: the email address to send to
- `BLUESKY_IDENTIFIER`: Your Blue Sky handle (e.g., yourname.bsky.social)
- `BLUESKY_PASSWORD`: Your Blue Sky password from step 2

### 5. Test the workflow
- Go to Actions → Weekly Blue Sky Likes Email
- Click "Run workflow" to test it manually
- Check your email for the weekly digest

## How it works

- **Authentication**: Logs into Blue Sky using credentials from environment variables.
- **Schedule**: Runs every Monday at 2:00 AM UTC (8 or 9 pm in Central timezone)
- **Data**: Fetches all your likes from the past 7 days, with a safety limit of 500 likes.
- **Content**: Includes post text, author info, images, videos, and links
- **Email**: Sends a formatted HTML and plain text email with all the content using Gmail's SMTP server

## Privacy

This script:
- Only accesses your own Blue Sky likes
- Runs on GitHub's servers
- Only sends emails to addresses you specify
- Does not store or share your data with third parties
