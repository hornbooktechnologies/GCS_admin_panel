import React from "react";
import TestimonialsManager from "../components/testimonials/TestimonialsManager";

const PatientTestimonials = () => {
  return (
    <TestimonialsManager
      title="Patient Testimonials"
      subtitle="Manage patient testimonial videos for GCS Hospital."
      endpoint="/patient-testimonials"
      emptyTitle="No patient testimonials found"
      emptyDescription="Create your first patient testimonial entry."
    />
  );
};

export default PatientTestimonials;
