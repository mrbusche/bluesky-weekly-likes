# Bluesky Weekly Likes Email

This project automatically sends you a weekly email containing all your Bluesky likes from the past week, including text content and links to any images or videos.

For accessibility purposes there is an HTML and text version of the generated email.

## Setup Instructions

### Prerequisites
- [Deno](https://deno.land/) installed on your system

### 1. Fork this repository to your GitHub account

### 2. Set up Bluesky credentials
- You'll need your Bluesky username/handle and password
- Note: You will want to create an app-specific password for Bluesky

### 3. Set up email credentials
For Gmail (recommended):
- Generate an app-specific password:
  1. Go to Google Account settings
  2. Security → 2-Step Verification → App passwords
  3. Generate a new app password for this script

### 4. Configure Environment Variables
Create a `.env` file in the project root with the following variables:

```
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
RECIPIENT_EMAILS=email_address_to_send_to
BLUESKY_IDENTIFIER=your_bluesky_handle
BLUESKY_PASSWORD=your_bluesky_password
```

### 5. Run the script
```bash
# Install dependencies and run
deno task fetch-likes

# Or run directly with permissions
deno run --allow-net --allow-env --allow-read fetch-bluesky-likes.ts
```

### 6. For GitHub Actions (Optional)
If you want to run this automatically via GitHub Actions, configure these repository secrets:

- `EMAIL_USER`: your gmail address
- `EMAIL_PASS`: your gmail app password
- `RECIPIENT_EMAILS`: the email address to send to
- `BLUESKY_IDENTIFIER`: Your Bluesky handle (e.g., yourname.bsky.social)
- `BLUESKY_PASSWORD`: Your Bluesky password from step 2

## How it works

- **Authentication**: Logs into Bluesky using credentials from environment variables.
- **Data**: Fetches all your likes from the past 7 days, with a safety limit of 500 likes.
- **Content**: Includes post text, author info, images, videos, and links
- **Email**: Sends a formatted HTML and plain text email with all the content using Gmail's SMTP server

## Development

This project has been converted to run on [Deno](https://deno.land/), a modern JavaScript/TypeScript runtime.

### Migration from Node.js

This project was originally built for Node.js and has been converted to Deno. Key changes:

- Replaced `require()` statements with ES6 `import` statements
- Updated HTTP client from Node.js `https` module to Deno's `fetch` API
- Replaced `dotenv` package with Deno's built-in environment variable access
- Converted to TypeScript for better type safety
- Updated configuration from `package.json` to `deno.json`

### Available Tasks

```bash
# Run the main script
deno task fetch-likes

# Format code
deno task format

# Lint code
deno task lint
```

### Dependencies

- `@atproto/api`: Bluesky API client
- `nodemailer`: Email sending library
- Deno standard library for environment variables and HTTP requests

## Privacy

This script:
- Only accesses your own Bluesky likes
- Runs on GitHub's servers
- Only sends emails to addresses you specify
- Does not store or share your data with third parties
