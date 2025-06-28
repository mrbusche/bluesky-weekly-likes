const { BskyAgent } = require("@atproto/api");
require("dotenv").config();
const nodemailer = require("nodemailer");

const senderEmail = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASS;
const recipientEmails = process.env.RECIPIENT_EMAILS;

const blueskyIdentifier = process.env.BLUESKY_IDENTIFIER;
const blueskyPassword = process.env.BLUESKY_PASSWORD;

const agent = new BskyAgent({
	service: "https://bsky.social",
});

const sendEmail = async () => {
	console.log("Starting Blue Sky likes email process...");

	await authenticate();
	const likes = await fetchWeeklyLikes();
	const formattedLikes = formatLikesForEmail(likes);
	console.log(formattedLikes);

	const transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: senderEmail,
			pass: emailPassword,
		},
	});

	const mailOptions = {
		from: senderEmail,
		to: recipientEmails,
		subject: `Weekly Blue Sky Likes`,
		html: formattedLikes.html,
		text: formattedLikes.text,
	};

	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			return console.error("Error sending email:", error);
		}
		console.log("Email sent successfully:", info.response);
	});
};

const authenticate = async () => {
	try {
		await agent.login({
			identifier: blueskyIdentifier,
			password: blueskyPassword,
		});
		console.log("Successfully authenticated with Blue Sky");
	} catch (error) {
		console.error("Authentication failed:", error);
		throw error;
	}
};

const fetchWeeklyLikes = async () => {
	try {
		const oneWeekAgo = new Date();
		oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
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
				const oldestPost = new Date(
					response.data.feed[response.data.feed.length - 1].post.indexedAt,
				);
				if (oldestPost < oneWeekAgo) {
					break;
				}
			}
		} while (cursor && likes.length < 500); // Safety limit

		console.log(`Found ${likes.length} likes from the past week`);
		return likes;
	} catch (error) {
		console.error("Error fetching likes:", error);
		throw error;
	}
};

const formatLikesForEmail = (likes) => {
	if (likes.length === 0) {
		return {
			html: "<p>No likes found for the past week.</p>",
			text: "No likes found for the past week.",
		};
	}

	let html = `
    <h1>Your Blue Sky Likes - Past Week</h1>
    <p>You liked ${likes.length} posts this week!</p>
    <hr>
  `;

	let text = `Your Blue Sky Likes - Past Week\n\nYou liked ${likes.length} posts this week!\n\n`;
	const usDateFormatter = new Intl.DateTimeFormat("en-US");

	likes.forEach((like, index) => {
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
          ${record.text || "No text content"}
        </blockquote>
    `;

		// Text version
		text += `\n--- Post #${index + 1} ---\n`;
		text += `Author: ${author.displayName || author.handle} (@${author.handle})\n`;
		text += `Posted: ${likedAt}\n`;
		text += `Text: ${record.text || "No text content"}\n`;

		// Handle embedded content
		if (post.embed) {
			if (post.embed.images && post.embed.images.length > 0) {
				html += "<p><strong>Images:</strong></p><ul>";
				text += "Images:\n";

				post.embed.images.forEach((image, imgIndex) => {
					html += `<li><a href="${image.fullsize}" target="_blank">Image ${imgIndex + 1}</a>${image.alt ? ` - ${image.alt}` : ""}</li>`;
					text += `- Image ${imgIndex + 1}: ${image.fullsize}${image.alt ? ` (Alt: ${image.alt})` : ""}\n`;
				});

				html += "</ul>";
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
		}

		html += `<p><a href="https://bsky.app/profile/${author.handle}/post/${post.uri.split("/").pop()}" target="_blank" style="color: #007acc;">View on Blue Sky</a></p>`;
		text += `View on Blue Sky: https://bsky.app/profile/${author.handle}/post/${post.uri.split("/").pop()}\n`;

		html += "</div>";
		text += "\n";
	});

	return { html, text };
};

sendEmail();
