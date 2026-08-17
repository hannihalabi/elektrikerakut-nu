export const servicePhotos = [
  "/b1.png",
  "/b2.png",
  "/b3.png",
  "/b4.png",
  "/b5.png",
  "/b6.png",
  "/b7.png",
  "/b8.png",
  "/b9.png",
] as const;

/** Gives every generated detail page a stable, varied photo without storing a
 * duplicate image reference in its content record. */
export function servicePhotoFor(key: string) {
  let value = 0;
  for (let index = 0; index < key.length; index += 1) value = ((value * 31) + key.charCodeAt(index)) >>> 0;
  return servicePhotos[value % servicePhotos.length];
}
