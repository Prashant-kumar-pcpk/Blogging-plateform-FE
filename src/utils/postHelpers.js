export const toggleId = (items, id) =>
  items.includes(id) ? items.filter((item) => item !== id) : [...items, id];

export const stripHtml = (html) => html.replace(/<[^>]+>/g, " ");

export const sharePlatforms = ["facebook", "twitter", "linkedin", "whatsapp", "mail"];

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
