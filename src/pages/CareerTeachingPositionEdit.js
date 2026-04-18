import React from "react";
import CareerAssetFormPage from "../components/career/CareerAssetFormPage";

const config = {
  singular: "Teaching Position",
  plural: "Teaching Positions",
  apiBase: "/career/teaching-positions",
  listPath: "/career/teaching-positions",
};

const CareerTeachingPositionEdit = () => <CareerAssetFormPage config={config} mode="edit" />;

export default CareerTeachingPositionEdit;
