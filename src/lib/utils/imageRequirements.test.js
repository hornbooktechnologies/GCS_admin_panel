import {
  IMAGE_REQUIREMENTS,
  assessImageDimensions,
  formatDetectedRatio,
} from "./imageRequirements";

describe("image requirements", () => {
  test("keeps the advertisement ratio at exactly 4:5", () => {
    const requirement = IMAGE_REQUIREMENTS.advertisementBanner;

    expect(requirement.ratioLabel).toBe("4:5");
    expect(requirement.minWidth).toBe(1200);
    expect(requirement.minHeight).toBe(1500);
    expect(assessImageDimensions(requirement, 1200, 1500)).toEqual(
      expect.objectContaining({ ratioMatches: true, resolutionMatches: true }),
    );
  });

  test("accepts small ratio variation within the five-percent tolerance", () => {
    const result = assessImageDimensions(IMAGE_REQUIREMENTS.blogThumbnail, 1280, 780);

    expect(result.ratioMatches).toBe(true);
    expect(result.resolutionMatches).toBe(false);
  });

  test("reports mismatched ratios and undersized images independently", () => {
    const ratioMismatch = assessImageDimensions(IMAGE_REQUIREMENTS.doctorPhoto, 1200, 800);
    const lowResolution = assessImageDimensions(IMAGE_REQUIREMENTS.doctorPhoto, 600, 600);

    expect(ratioMismatch.ratioMatches).toBe(false);
    expect(ratioMismatch.resolutionMatches).toBe(true);
    expect(lowResolution.ratioMatches).toBe(true);
    expect(lowResolution.resolutionMatches).toBe(false);
  });

  test("formats familiar image ratios", () => {
    expect(formatDetectedRatio(1200, 800)).toBe("3:2");
    expect(formatDetectedRatio(1880, 1460)).toBe("94:73");
  });
});
