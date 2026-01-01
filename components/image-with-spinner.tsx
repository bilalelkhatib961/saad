"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";

type ImageWithSpinnerProps = ImageProps & {
  wrapperClassName?: string;
};

export function ImageWithSpinner({
  wrapperClassName,
  className,
  onLoadingComplete,
  src,
  ...props
}: ImageWithSpinnerProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
  }, [src]);

  const imageClassName = `${className ?? ""} transition-opacity duration-300 ${
    isLoading ? "opacity-0" : "opacity-100"
  }`.trim();

  return (
    <div className={`relative ${wrapperClassName ?? ""}`.trim()}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="h-16 w-16 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
        </div>
      )}
      <Image
        {...props}
        src={src}
        className={imageClassName}
        onLoadingComplete={(result) => {
          setIsLoading(false);
          onLoadingComplete?.(result);
        }}
      />
    </div>
  );
}
