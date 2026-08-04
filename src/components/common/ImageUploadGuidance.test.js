import { render, screen } from "@testing-library/react";
import ImageUploadGuidance from "./ImageUploadGuidance";

describe("ImageUploadGuidance", () => {
  test("renders the configured recommendation without blocking input", () => {
    render(<ImageUploadGuidance requirementKey="advertisementBanner" />);

    expect(screen.getByText(/Recommended: 4:5/)).toBeInTheDocument();
    expect(screen.getByText(/1200 × 1500 px or larger/)).toBeInTheDocument();
    expect(screen.getByText(/Select an image to check its dimensions/)).toBeInTheDocument();
  });

  test("does not render for an unknown requirement", () => {
    const { container } = render(<ImageUploadGuidance requirementKey="missing" />);

    expect(container).toBeEmptyDOMElement();
  });

  test("shows detected dimensions and a non-blocking mismatch warning", async () => {
    const OriginalImage = window.Image;

    window.Image = class MockImage {
      set src(value) {
        this.currentSrc = value;
        this.naturalWidth = 1200;
        this.naturalHeight = 800;
        Promise.resolve().then(() => this.onload?.());
      }
    };

    try {
      render(
        <ImageUploadGuidance
          requirementKey="doctorPhoto"
          src="https://example.com/doctor.jpg"
        />,
      );

      expect(await screen.findByText(/1200 × 800 px · 3:2/)).toBeInTheDocument();
      expect(screen.getByText(/ratio differs; public display may crop it/)).toBeInTheDocument();
    } finally {
      window.Image = OriginalImage;
    }
  });
});
