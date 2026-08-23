export const PROFILE_IMAGE_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 400'%3E%3Crect width='320' height='400' fill='%23080912'/%3E%3Ccircle cx='160' cy='132' r='58' fill='%23d89075' fill-opacity='.42'/%3E%3Cpath d='M52 356c12-82 57-123 108-123s96 41 108 123' fill='%23ff3f7f' fill-opacity='.3'/%3E%3C/svg%3E";

export function useProfileImagePlaceholder(event: React.SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied) return;
  image.dataset.fallbackApplied = "true";
  image.src = PROFILE_IMAGE_PLACEHOLDER;
}
