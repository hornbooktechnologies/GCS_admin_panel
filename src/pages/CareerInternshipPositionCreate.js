import React from "react";
import CareerAssetFormPage from "../components/career/CareerAssetFormPage";

const config = {
  singular: "Internship Position",
  plural: "Internship Positions",
  apiBase: "/career/internship-positions",
  listPath: "/career/internship-positions",
};

const CareerInternshipPositionCreate = () => <CareerAssetFormPage config={config} mode="create" />;

export default CareerInternshipPositionCreate;
