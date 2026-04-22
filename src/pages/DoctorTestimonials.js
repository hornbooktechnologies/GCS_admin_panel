import React from "react";
import TestimonialsManager from "../components/testimonials/TestimonialsManager";

const DoctorTestimonials = () => {
  return (
    <TestimonialsManager
      title="Doctor Testimonials"
      subtitle="Manage doctor testimonial videos for GCS Hospital."
      endpoint="/doctor-testimonials"
      moduleKey="doctor-testimonials"
      emptyTitle="No doctor testimonials found"
      emptyDescription="Create your first doctor testimonial entry."
    />
  );
};

export default DoctorTestimonials;
