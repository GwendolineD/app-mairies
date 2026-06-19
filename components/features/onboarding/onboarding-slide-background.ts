import type { CSSProperties } from "react";
import { ILLUSTRATIONS } from "@/lib/constants/illustrations";
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
      const url = ILLUSTRATIONS.resident.onboarding.welcome;
      if (!url) return {};
      return {
        className: "bg-cover bg-right bg-no-repeat",
        style: {
          backgroundImage: `${ONBOARDING_ILLUSTRATION_OVERLAY}, url(${url})`,
        },
      };
    }
    case "annonces": {
      const url = ILLUSTRATIONS.resident.onboarding.annonces;
      if (!url) return {};
      return {
        className: "bg-no-repeat",
        style: {
          backgroundImage: `url(${url})`,
          backgroundPosition: "right bottom",
          backgroundSize: "min(68%, 230px) auto",
        },
      };
    }
    case "initiatives": {
      const url = ILLUSTRATIONS.resident.onboarding.initiatives;
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
      const url = ILLUSTRATIONS.resident.onboarding.evenements;
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
