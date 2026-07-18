import type { CSSProperties } from "react";
import { ILLUSTRATIONS } from "@/lib/constants/illustrations";
import { buildOptimizedCloudinaryUrl } from "@/lib/services/cloudinary";
import type { OnboardingSlideId } from "./onboarding-slide-content";

const ONBOARDING_ILLUSTRATION_OVERLAY =
  "linear-gradient(rgba(251, 251, 252, 0.75), rgba(251, 251, 252, 0.75))";

const ONBOARDING_EVENEMENTS_OVERLAY =
  "linear-gradient(rgba(251, 251, 252, 0.80), rgba(251, 251, 252, 0.80))";

export function getOnboardingSlideBackground(slide: OnboardingSlideId): {
  className?: string;
  style?: CSSProperties;
} {
  switch (slide) {
    case "welcome": {
      const url = buildOptimizedCloudinaryUrl(
        ILLUSTRATIONS.resident.onboarding.welcome,
        { width: 1200 },
      );
      if (!url) return {};
      return {
        className: "bg-cover bg-right bg-no-repeat",
        style: {
          backgroundImage: `${ONBOARDING_ILLUSTRATION_OVERLAY}, url(${url})`,
        },
      };
    }
    case "accueil":
      return {};
    case "annonces": {
      const url = buildOptimizedCloudinaryUrl(
        ILLUSTRATIONS.resident.onboarding.annonces,
        { width: 1200 },
      );
      if (!url) return {};
      return {
        className:
          "bg-no-repeat [background-position:right_bottom] max-md:[background-position:right_85%]",
        style: {
          backgroundImage: `url(${url})`,
          backgroundSize: "min(68%, 230px) auto",
        },
      };
    }
    case "initiatives": {
      const url = buildOptimizedCloudinaryUrl(
        ILLUSTRATIONS.resident.onboarding.initiatives,
        { width: 1200 },
      );
      if (!url) return {};
      return {
        className: "bg-no-repeat bg-bottom",
        style: {
          backgroundImage: `${ONBOARDING_ILLUSTRATION_OVERLAY}, url(${url})`,
          backgroundOrigin: "border-box",
          backgroundSize: "100% auto",
        },
      };
    }
    case "evenements": {
      const url = buildOptimizedCloudinaryUrl(
        ILLUSTRATIONS.resident.onboarding.evenements,
        { width: 1200 },
      );
      if (!url) return {};
      return {
        className: "bg-cover bg-left bg-no-repeat",
        style: {
          backgroundImage: `${ONBOARDING_EVENEMENTS_OVERLAY}, url(${url})`,
        },
      };
    }
    default:
      return {};
  }
}
