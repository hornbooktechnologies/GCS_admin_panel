import React from "react";
import CareerAssetFormPage from "../components/career/CareerAssetFormPage";

const config = {
  singular: "Internship Position",
  plural: "Internship Positions",
  apiBase: "/career/internship-positions",
  listPath: "/career/internship-positions",
};

const CareerInternshipPositionEdit = () => <CareerAssetFormPage config={config} mode="edit" />;

export default CareerInternshipPositionEdit;
