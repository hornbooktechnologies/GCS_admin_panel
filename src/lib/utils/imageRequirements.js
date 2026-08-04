export const IMAGE_RATIO_TOLERANCE = 0.05;

export const IMAGE_REQUIREMENTS = Object.freeze({
  homeBanner: {
    ratioLabel: "24:7",
    ratioWidth: 24,
    ratioHeight: 7,
    minWidth: 1920,
    minHeight: 560,
    fit: "cover",
    note: "Full-width cover; mobile crops the sides. Keep important content inside the central 60%.",
  },
  advertisementBanner: {
    ratioLabel: "4:5",
    ratioWidth: 4,
    ratioHeight: 5,
    minWidth: 1200,
    minHeight: 1500,
    fit: "contain",
    note: "The complete image stays visible. Use identical dimensions for both advertisement slots.",
  },
  blogThumbnail: {
    ratioLabel: "16:10",
    ratioWidth: 16,
    ratioHeight: 10,
    minWidth: 1280,
    minHeight: 800,
    fit: "cover",
    note: "Used on listing cards and cropped to fill. Keep the subject centred.",
  },
  blogDetail: {
    ratioLabel: "2:1",
    ratioWidth: 2,
    ratioHeight: 1,
    minWidth: 1600,
    minHeight: 800,
    fit: "cover",
    note: "Used as the wide article image and cropped to fill.",
  },
  newsThumbnail: {
    ratioLabel: "16:10",
    ratioWidth: 16,
    ratioHeight: 10,
    minWidth: 1280,
    minHeight: 800,
    fit: "cover",
    note: "Used on news cards and cropped to fill. Keep the subject centred.",
  },
  newsDetail: {
    ratioLabel: "2:1",
    ratioWidth: 2,
    ratioHeight: 1,
    minWidth: 1600,
    minHeight: 800,
    fit: "cover",
    note: "Used on the detail page and featured story area as a wide cover image.",
  },
  eventThumbnail: {
    ratioLabel: "16:10",
    ratioWidth: 16,
    ratioHeight: 10,
    minWidth: 1600,
    minHeight: 1000,
    fit: "cover",
    note: "Used on event cards and cropped to fill.",
  },
  eventGallery: {
    ratioLabel: "16:10",
    ratioWidth: 16,
    ratioHeight: 10,
    minWidth: 1600,
    minHeight: 1000,
    fit: "cover",
    note: "Cards crop to 16:10; the event modal preserves the complete image.",
  },
  specialityTopBanner: {
    ratioLabel: "16:5",
    ratioWidth: 16,
    ratioHeight: 5,
    minWidth: 1920,
    minHeight: 600,
    fit: "cover",
    note: "Wide department hero. Keep the subject and important content centred.",
  },
  specialityMain: {
    ratioLabel: "16:10",
    ratioWidth: 16,
    ratioHeight: 10,
    minWidth: 1600,
    minHeight: 1000,
    fit: "cover",
    note: "Responsive department content image; edges may crop on narrow screens.",
  },
  specialityBrochure: {
    ratioLabel: "A4 portrait",
    ratioWidth: 210,
    ratioHeight: 297,
    minWidth: 1240,
    minHeight: 1754,
    fit: "contain",
    note: "For image brochures only. The file opens as a document without cropping; PDF is preferred.",
  },
  doctorPhoto: {
    ratioLabel: "1:1",
    ratioWidth: 1,
    ratioHeight: 1,
    minWidth: 800,
    minHeight: 800,
    fit: "cover",
    note: "Displayed as a square crop. Centre the face and leave comfortable headroom.",
  },
  teamMember: {
    ratioLabel: "4:5",
    ratioWidth: 4,
    ratioHeight: 5,
    minWidth: 800,
    minHeight: 1000,
    fit: "cover",
    note: "Displayed in portrait cards and on the member profile page.",
  },
  campusLife: {
    ratioLabel: "1:1",
    ratioWidth: 1,
    ratioHeight: 1,
    minWidth: 1200,
    minHeight: 1200,
    fit: "cover",
    note: "Displayed as a square gallery image. Keep the subject centred.",
  },
  symptom: {
    ratioLabel: "1:1",
    ratioWidth: 1,
    ratioHeight: 1,
    minWidth: 800,
    minHeight: 800,
    fit: "cover",
    note: "Used in circular and square crops. Keep the subject centred with space around it.",
  },
  facility: {
    ratioLabel: "16:11",
    ratioWidth: 16,
    ratioHeight: 11,
    minWidth: 1600,
    minHeight: 1100,
    fit: "cover",
    note: "Displayed as a facility-card cover image and may crop slightly at the edges.",
  },
  healthCheckup: {
    ratioLabel: "16:10",
    ratioWidth: 16,
    ratioHeight: 10,
    minWidth: 1280,
    minHeight: 800,
    fit: "cover",
    note: "Displayed as the health-checkup plan card image.",
  },
  careerAsset: {
    ratioLabel: "16:9",
    ratioWidth: 16,
    ratioHeight: 9,
    minWidth: 1280,
    minHeight: 720,
    fit: "cover",
    note: "Displayed as a teaching or internship position card cover.",
  },
  downloadCover: {
    ratioLabel: "4:5",
    ratioWidth: 4,
    ratioHeight: 5,
    minWidth: 1200,
    minHeight: 1500,
    fit: "cover",
    note: "Displayed as a portrait document cover.",
  },
  newsletterCover: {
    ratioLabel: "3:4",
    ratioWidth: 3,
    ratioHeight: 4,
    minWidth: 1200,
    minHeight: 1600,
    fit: "cover",
    note: "Displayed as a newsletter or book cover.",
  },
  newsletterAttachment: {
    ratioLabel: "A4 portrait",
    ratioWidth: 210,
    ratioHeight: 297,
    minWidth: 1240,
    minHeight: 1754,
    fit: "contain",
    note: "For image editions only. The attachment opens without cropping; PDF is preferred.",
  },
  awardImage: {
    ratioLabel: "4:3",
    ratioWidth: 4,
    ratioHeight: 3,
    minWidth: 1200,
    minHeight: 900,
    fit: "cover",
    note: "Intended award-card format. Awards are not currently rendered dynamically on the public site.",
  },
  studentTestimonial: {
    ratioLabel: "1:1",
    ratioWidth: 1,
    ratioHeight: 1,
    minWidth: 800,
    minHeight: 800,
    fit: "cover",
    note: "Intended profile-photo format. Student testimonials are not currently rendered dynamically on the public site.",
  },
});

export const getImageRequirement = (key) => IMAGE_REQUIREMENTS[key];

export function assessImageDimensions(requirement, width, height) {
  if (!requirement || !width || !height) return null;

  const expectedRatio = requirement.ratioWidth / requirement.ratioHeight;
  const actualRatio = width / height;
  const ratioDifference = Math.abs(actualRatio - expectedRatio) / expectedRatio;

  return {
    ratioMatches: ratioDifference <= IMAGE_RATIO_TOLERANCE,
    resolutionMatches: width >= requirement.minWidth && height >= requirement.minHeight,
    ratioDifference,
  };
}

function greatestCommonDivisor(first, second) {
  let a = Math.abs(Math.round(first));
  let b = Math.abs(Math.round(second));

  while (b) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }

  return a || 1;
}

export function formatDetectedRatio(width, height) {
  if (!width || !height) return "";

  const divisor = greatestCommonDivisor(width, height);
  const ratioWidth = Math.round(width / divisor);
  const ratioHeight = Math.round(height / divisor);

  if (ratioWidth <= 100 && ratioHeight <= 100) {
    return `${ratioWidth}:${ratioHeight}`;
  }

  return `${(width / height).toFixed(2)}:1`;
}
