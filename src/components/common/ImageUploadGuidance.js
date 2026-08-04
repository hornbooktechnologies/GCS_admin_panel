import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Image as ImageIcon, Info, TriangleAlert } from "lucide-react";
import { cn } from "../../lib/utils/utils";
import {
  assessImageDimensions,
  formatDetectedRatio,
  getImageRequirement,
} from "../../lib/utils/imageRequirements";

const asList = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value];
};

const isImageFile = (file) => file instanceof Blob && file.type?.startsWith("image/");

function loadImageDimensions(source, index) {
  return new Promise((resolve) => {
    const file = source.file;
    const sourceUrl = isImageFile(file) ? URL.createObjectURL(file) : source.src;

    if (!sourceUrl) {
      resolve(null);
      return;
    }

    const image = new window.Image();
    const finish = (result) => {
      if (isImageFile(file)) URL.revokeObjectURL(sourceUrl);
      resolve(result);
    };

    image.onload = () => finish({
      id: `${index}-${sourceUrl}`,
      name: file?.name || source.label || `Image ${index + 1}`,
      width: image.naturalWidth,
      height: image.naturalHeight,
    });
    image.onerror = () => finish(null);
    image.src = sourceUrl;
  });
}

export default function ImageUploadGuidance({
  requirementKey,
  file,
  files,
  src,
  sources,
  className,
}) {
  const requirement = getImageRequirement(requirementKey);
  const [dimensions, setDimensions] = useState([]);

  const inspectionSources = useMemo(() => {
    const fileList = asList(files || file).filter(isImageFile);
    if (fileList.length) return fileList.map((item) => ({ file: item }));

    return asList(sources || src).map((item, index) =>
      typeof item === "string"
        ? { src: item, label: `Existing image ${index + 1}` }
        : { src: item?.src || item?.image_url || item?.url, label: item?.label },
    );
  }, [file, files, src, sources]);

  useEffect(() => {
    let active = true;

    if (!inspectionSources.length) {
      setDimensions([]);
      return undefined;
    }

    Promise.all(inspectionSources.map(loadImageDimensions)).then((results) => {
      if (active) setDimensions(results.filter(Boolean));
    });

    return () => {
      active = false;
    };
  }, [inspectionSources]);

  if (!requirement) return null;

  const checkedImages = dimensions.map((item) => ({
    ...item,
    assessment: assessImageDimensions(requirement, item.width, item.height),
  }));
  const unsuitableImages = checkedImages.filter(
    (item) => !item.assessment?.ratioMatches || !item.assessment?.resolutionMatches,
  );
  const isSuitable = checkedImages.length > 0 && unsuitableImages.length === 0;
  const hasWarning = unsuitableImages.length > 0;
  const statusIcon = isSuitable ? CheckCircle2 : hasWarning ? TriangleAlert : Info;
  const StatusIcon = statusIcon;

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-3 text-xs leading-5",
        isSuitable
          ? "border-emerald-200 bg-emerald-50/70 text-emerald-800"
          : hasWarning
            ? "border-amber-200 bg-amber-50/80 text-amber-900"
            : "border-sky-200 bg-sky-50/70 text-slate-600",
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        <StatusIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div className="min-w-0 space-y-1">
          <p className="font-semibold text-slate-800">
            Recommended: {requirement.ratioLabel} · {requirement.minWidth} × {requirement.minHeight} px or larger
          </p>
          <p>{requirement.note}</p>

          {checkedImages.length === 1 ? (
            <ImageStatus item={checkedImages[0]} />
          ) : checkedImages.length > 1 ? (
            <div className="space-y-1 pt-1">
              <p className="font-semibold">
                Checked {checkedImages.length} images · {checkedImages.length - unsuitableImages.length} suitable · {unsuitableImages.length} need attention
              </p>
              {unsuitableImages.slice(0, 3).map((item) => (
                <ImageStatus key={item.id} item={item} compact />
              ))}
              {unsuitableImages.length > 3 ? (
                <p>And {unsuitableImages.length - 3} more images need attention.</p>
              ) : null}
            </div>
          ) : (
            <p className="flex items-center gap-1.5 pt-1 text-slate-500">
              <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Select an image to check its dimensions.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ImageStatus({ item, compact = false }) {
  const { assessment } = item;
  const problems = [];

  if (!assessment.ratioMatches) problems.push("ratio differs; public display may crop it");
  if (!assessment.resolutionMatches) problems.push("resolution is below recommendation");

  return (
    <p className={cn("break-words pt-1", compact && "pl-1")}>
      {compact ? `${item.name}: ` : "Image: "}
      <span className="font-semibold">
        {item.width} × {item.height} px · {formatDetectedRatio(item.width, item.height)}
      </span>
      {problems.length ? ` · ${problems.join("; ")}.` : " · Dimensions are suitable."}
    </p>
  );
}
