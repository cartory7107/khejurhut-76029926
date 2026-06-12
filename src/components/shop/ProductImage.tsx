import { type ImgHTMLAttributes } from "react";
import { DEFAULT_PRODUCT_IMAGE, normalizeImageUrl } from "@/lib/images";

type ProductImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fallbackSrc?: string;
};

export function ProductImage({
  src,
  fallbackSrc = DEFAULT_PRODUCT_IMAGE,
  onError,
  ...props
}: ProductImageProps) {
  const normalizedSrc = normalizeImageUrl(src) || fallbackSrc;

  return (
    <img
      {...props}
      src={normalizedSrc}
      onError={(event) => {
        if (event.currentTarget.getAttribute("src") !== fallbackSrc) {
          event.currentTarget.src = fallbackSrc;
        }
        onError?.(event);
      }}
    />
  );
}
