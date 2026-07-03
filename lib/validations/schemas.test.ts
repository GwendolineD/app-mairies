import { describe, expect, it } from "vitest";
import { ANNOUNCEMENT_CATEGORY_SLUGS } from "@/lib/constants/announcement-categories";
import { ANNOUNCEMENT_TYPE_SLUGS } from "@/lib/constants/announcement-types";
import { announcementSchema, avatarUpdateSchema } from "@/lib/validations/schemas";

const validAnnouncementBase = {
  type: ANNOUNCEMENT_TYPE_SLUGS[0],
  categorySlug: ANNOUNCEMENT_CATEGORY_SLUGS[0],
  title: "Titre test",
  description: "Description test",
  addressStreet: "1 rue Test",
  addressCity: "Paris",
  addressCitycode: "75056",
  addressPostcode: "75001",
  addressLat: 48.8566,
  addressLng: 2.3522,
};

describe("optionalCloudinaryPhotoUrl", () => {
  it("accepts empty photo URL", () => {
    const result = announcementSchema.safeParse({
      ...validAnnouncementBase,
      photoUrl: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts Cloudinary delivery URL", () => {
    const result = announcementSchema.safeParse({
      ...validAnnouncementBase,
      photoUrl:
        "https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-Cloudinary URL", () => {
    const result = announcementSchema.safeParse({
      ...validAnnouncementBase,
      photoUrl: "https://example.com/photo.jpg",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid avatar URL", () => {
    const result = avatarUpdateSchema.safeParse({
      avatarUrl: "https://evil.example/avatar.png",
    });
    expect(result.success).toBe(false);
  });
});
