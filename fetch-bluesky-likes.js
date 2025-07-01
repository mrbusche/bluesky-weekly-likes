const { AtpAgent } = require('@atproto/api');
require('dotenv').config();
const nodemailer = require('nodemailer');
const https = require('node:https'); // Import the built-in https module

const senderEmail = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASS;
const recipientEmails = process.env.RECIPIENT_EMAILS;

const blueskyIdentifier = process.env.BLUESKY_IDENTIFIER;
const blueskyPassword = process.env.BLUESKY_PASSWORD;

const agent = new AtpAgent({
  service: 'https://bsky.social',
});

const oneWeekAgo = new Date();
oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
const usDateFormatter = new Intl.DateTimeFormat('en-US');

const sendEmail = async () => {
  console.log('Starting Bluesky likes email process...');

  await authenticate();
  const likes = await fetchWeeklyLikes();
  const formattedLikes = await formatLikesForEmail(likes);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: senderEmail,
      pass: emailPassword,
    },
  });

  const mailOptions = {
    from: senderEmail,
    to: recipientEmails,
    subject: `Weekly Bluesky Likes from ${usDateFormatter.format(oneWeekAgo)}`,
    html: formattedLikes.html,
    text: formattedLikes.text,
    attachments: formattedLikes.attachments,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.error('Error sending email:', error);
    }
    console.log('Email sent successfully:', info.response);
  });
};

const authenticate = async () => {
  try {
    await agent.login({
      identifier: blueskyIdentifier,
      password: blueskyPassword,
    });
    console.log('Successfully authenticated with Bluesky');
  } catch (error) {
    console.error('Authentication failed:', error);
    throw error;
  }
};

const fetchWeeklyLikes = async () => {
  try {
    const likes = [];
    let cursor;

    console.log(`Fetching likes since ${oneWeekAgo}`);

    do {
      const response = await agent.getActorLikes({
        actor: agent.session.did,
        cursor: cursor,
        limit: 100,
      });

      const weeklyLikes = response.data.feed.filter((item) => {
        const likedAt = new Date(item.post.indexedAt);
        return likedAt >= oneWeekAgo;
      });

      likes.push(...weeklyLikes);
      cursor = response.data.cursor;

      // If we've gone past a week, stop fetching
      if (response.data.feed.length > 0) {
        const oldestPost = new Date(response.data.feed[response.data.feed.length - 1].post.indexedAt);
        if (oldestPost < oneWeekAgo) {
          break;
        }
      }
    } while (cursor && likes.length < 500); // Safety limit

    console.log(`Found ${likes.length} likes from the past week`);
    return likes;
  } catch (error) {
    console.error('Error fetching likes:', error);
    throw error;
  }
};

const getImageBase64 = (url) => {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (response.statusCode < 200 || response.statusCode > 299) {
          return reject(new Error(`Failed to load page, status code: ${response.statusCode}`));
        }
        const body = [];
        response.on('data', (chunk) => body.push(chunk));
        response.on('end', () => {
          const buffer = Buffer.concat(body);
          const mimeType = response.headers['content-type'] || 'image/jpeg'; // Default to jpeg if not found
          resolve(`data:${mimeType};base64,${buffer.toString('base64')}`);
        });
      })
      .on('error', (e) => {
        reject(e);
      });
  });
};

const formatLikesForEmail = async (likes) => {
  if (likes.length === 0) {
    return {
      html: '<p>No likes found for the past week.</p>',
      text: 'No likes found for the past week.',
    };
  }

  let html = `
    <h1>Your Bluesky Likes - Past Week</h1>
    <p>You liked ${likes.length} posts this week!</p>
    <hr>
  `;

  let text = `Your Bluesky Likes - Past Week\n\nYou liked ${likes.length} posts this week!\n\n`;
  const attachments = [];

  for (const [index, like] of likes.entries()) {
    const post = like.post;
    const author = post.author;
    const record = post.record;
    const likedAt = usDateFormatter.format(new Date(post.indexedAt));

    // HTML version
    html += `
      <div style="border: 1px solid #ddd; margin: 20px 0; padding: 15px; border-radius: 8px;">
        <h3>Post #${index + 1}</h3>
        <p><strong>Author:</strong> ${author.displayName || author.handle} (@${author.handle})</p>
        <p><strong>Posted:</strong> ${likedAt}</p>
        <p><strong>Text:</strong></p>
        <blockquote style="background: #f5f5f5; padding: 10px; border-left: 4px solid #007acc;">
          ${record.text.replace(/\n/g, '<br/>') || 'No text content'}
        </blockquote>
    `;

    // Text version
    text += `\n--- Post #${index + 1} ---\n`;
    text += `Author: ${author.displayName || author.handle} (@${author.handle})\n`;
    text += `Posted: ${likedAt}\n`;
    text += `Text: ${record.text.replace(/\n/g, '<br/>') || 'No text content'}\n`;

    if (post.record.facets) {
      post.record.facets.forEach((facet) => {
        if (facet.features) {
          facet.features.forEach((feature) => {
            if (feature.$type === 'app.bsky.richtext.facet#link' && feature.uri) {
              html += `<p><strong>Link:</strong> <a href="${feature.uri}" target="_blank">${feature.uri}</a></p>`;
              text += `Link: ${feature.uri}\n`;
            }
          });
        }
      });
    }

    // Handle embedded content
    if (post.embed) {
      if (post.embed.images && post.embed.images.length > 0) {
        html += '<p><strong>Images:</strong></p><div style="display: flex; flex-wrap: wrap;">';
        text += 'Images:\n';

        for (const [imgIndex, image] of post.embed.images.entries()) {
          try {
            const base64Image = await getImageBase64(image.fullsize);
            const cid = `image_${index}_${imgIndex}`; // Unique Content ID for each image
            html += `<div style="margin: 5px;"><img src="cid:${cid}" alt="${image.alt || ''}" style="max-width: ${image.aspectRatio ? image.aspectRatio.width : 200}px; max-height: ${image.aspectRatio ? image.aspectRatio.height : 200}px;" /></div>`;
            attachments.push({
              filename: `image_${index}_${imgIndex}.jpg`, // Or use a better filename
              content: base64Image.split(',')[1], // Get only the base64 data
              encoding: 'base64',
              cid: cid, // Content ID
            });
            text += `- Image ${imgIndex + 1}: ${image.fullsize}${image.alt ? ` (Alt: ${image.alt})` : ''}\n`;
          } catch (error) {
            console.error(`Error fetching image ${image.fullsize}:`, error);
            html += `<p style="color: red;">Could not load image: ${image.fullsize}</p>`;
            text += `- Image ${imgIndex + 1}: Could not load image from ${image.fullsize}\n`;
          }
        }

        html += '</div>';
      }

      if (post.embed.video) {
        html += `<p><strong>Video:</strong> <a href="${post.embed.video.playlist}" target="_blank">Watch Video</a></p>`;
        text += `Video: ${post.embed.video.playlist}\n`;
      }

      if (post.embed.external) {
        const external = post.embed.external;
        html += `<p><strong>Link:</strong> <a href="${external.uri}" target="_blank">${external.title}</a></p>`;
        text += `Link: ${external.title} - ${external.uri}\n`;
        if (external.description) {
          html += `<p><em>${external.description}</em></p>`;
          text += `Description: ${external.description}\n`;
        }
      }

      const quotedPostText = post.embed.record?.value?.text;
      if (quotedPostText) {
        html += `<p><strong>Quoted Post Text:</strong></p><blockquote style="background: #f5f5f5; padding: 10px; border-left: 4px solid #007acc;">${quotedPostText.replace(/\n/g, '<br/>')}</blockquote>`;
        text += `Text: ${quotedPostText.replace(/\n/g, '<br/>')}\n`;
      }
    }

    html += `<p><a href="https://bsky.app/profile/${author.handle}/post/${post.uri.split('/').pop()}" target="_blank" style="color: #007acc;">View on Bluesky</a></p>`;
    text += `View on Bluesky: https://bsky.app/profile/${author.handle}/post/${post.uri.split('/').pop()}\n`;

    html += '</div>';
    text += '\n';
  }

  return { html, text, attachments };
};

sendEmail();
