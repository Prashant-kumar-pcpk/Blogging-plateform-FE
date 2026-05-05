export const toggleId = (items, id) =>
  items.includes(id) ? items.filter((item) => item !== id) : [...items, id];

export const stripHtml = (html = "") => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export const countWords = (html = "") => {
  const text = stripHtml(html);
  return text ? text.split(" ").filter(Boolean).length : 0;
};

export const estimateReadTime = (html = "") => {
  const words = countWords(html);
  return Math.max(1, Math.ceil(words / 265));
};

export const slugifyPreview = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const sharePlatforms = ["facebook", "twitter", "linkedin", "whatsapp", "mail"];

const YOUTUBE_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/i,
  /(?:https?:\/\/)?youtu\.be\/([^?&]+)/i,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?&]+)/i,
];

const VIMEO_PATTERN = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/i;

export const isValidHttpUrl = (value = "") => /^https?:\/\//i.test(String(value).trim());

export const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const getEmbedHtml = (url = "") => {
  const normalizedUrl = String(url).trim();

  if (!isValidHttpUrl(normalizedUrl)) {
    return "";
  }

  const youtubeMatch = YOUTUBE_PATTERNS.map((pattern) => normalizedUrl.match(pattern)).find(Boolean);
  if (youtubeMatch?.[1]) {
    const videoId = youtubeMatch[1];
    return `
      <figure class="embedded-media" contenteditable="false">
        <iframe
          src="https://www.youtube.com/embed/${escapeHtml(videoId)}"
          title="Embedded YouTube video"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        ></iframe>
        <figcaption><a href="${escapeHtml(normalizedUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(normalizedUrl)}</a></figcaption>
      </figure>
      <p><br></p>
    `;
  }

  const vimeoMatch = normalizedUrl.match(VIMEO_PATTERN);
  if (vimeoMatch?.[1]) {
    const videoId = vimeoMatch[1];
    return `
      <figure class="embedded-media" contenteditable="false">
        <iframe
          src="https://player.vimeo.com/video/${escapeHtml(videoId)}"
          title="Embedded Vimeo video"
          loading="lazy"
          allow="autoplay; fullscreen; picture-in-picture"
          allowfullscreen
        ></iframe>
        <figcaption><a href="${escapeHtml(normalizedUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(normalizedUrl)}</a></figcaption>
      </figure>
      <p><br></p>
    `;
  }

  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(normalizedUrl)) {
    return `
      <figure class="embedded-media" contenteditable="false">
        <video controls preload="metadata">
          <source src="${escapeHtml(normalizedUrl)}" />
          Your browser does not support the video tag.
        </video>
        <figcaption><a href="${escapeHtml(normalizedUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(normalizedUrl)}</a></figcaption>
      </figure>
      <p><br></p>
    `;
  }

  if (/\.(mp3|wav|ogg|m4a)(\?.*)?$/i.test(normalizedUrl)) {
    return `
      <figure class="embedded-media" contenteditable="false">
        <audio controls preload="metadata">
          <source src="${escapeHtml(normalizedUrl)}" />
          Your browser does not support the audio tag.
        </audio>
        <figcaption><a href="${escapeHtml(normalizedUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(normalizedUrl)}</a></figcaption>
      </figure>
      <p><br></p>
    `;
  }

  return `
    <figure class="embedded-media" contenteditable="false">
      <div class="media-link-card">
        <p>External media link</p>
        <a href="${escapeHtml(normalizedUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(normalizedUrl)}</a>
      </div>
    </figure>
    <p><br></p>
  `;
};

export const socialAccountLabels = {
  twitter: "Twitter",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  instagram: "Instagram",
  github: "GitHub",
  website: "Website",
  email: "Email",
};

export const getConnectedSocialAccounts = (user) => {
  if (!user) {
    return [];
  }

  const accounts = [];

  if (user.email) {
    accounts.push({
      key: "email",
      label: socialAccountLabels.email,
      value: user.email,
    });
  }

  Object.entries(user.socialLinks || {}).forEach(([key, value]) => {
    if (!value?.trim()) {
      return;
    }

    accounts.push({
      key,
      label: socialAccountLabels[key] || key,
      value,
    });
  });

  return accounts;
};
