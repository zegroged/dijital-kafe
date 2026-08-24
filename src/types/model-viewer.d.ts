import type { DetailedHTMLProps, HTMLAttributes } from "react";

// <model-viewer> web bileşeni için JSX tip tanımı.
// iOS → ios-src (.usdz), Android → src (.glb); model-viewer cihazı otomatik seçer.
type ModelViewerAttributes = DetailedHTMLProps<
  HTMLAttributes<HTMLElement>,
  HTMLElement
> & {
  src?: string;
  "ios-src"?: string;
  alt?: string;
  poster?: string;
  ar?: boolean;
  "ar-modes"?: string;
  "ar-scale"?: string;
  "camera-controls"?: boolean;
  "auto-rotate"?: boolean;
  "touch-action"?: string;
  "shadow-intensity"?: string | number;
  exposure?: string | number;
  loading?: "auto" | "lazy" | "eager";
  reveal?: "auto" | "manual" | "interaction";
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerAttributes;
    }
  }
}
