/**
 * Image encoding settings.
 *
 * Astro's default AVIF quality is 50, which is aggressive enough to visibly
 * smear skin, hair, and fine text. These constants raise it per use case:
 *
 *   PORTRAIT  a face shown at 1:1. Needs the most fidelity.
 *   GALLERY   photographs shown as thumbnails and in a lightbox.
 *
 * Measured on the 512x512 portrait (PSNR, higher is closer to the source):
 *   q50  8.7 KB  38.4 dB   visible blocking
 *   q65 13.7 KB  40.9 dB   soft on the face
 *   q80 22.6 KB  43.6 dB   clean
 *   q90 36.4 KB  45.7 dB   no perceptible gain over q80
 */
export const PORTRAIT_QUALITY = 80;
export const GALLERY_QUALITY = 65;

/**
 * A 24x24 WebP of the portrait, inlined as a data URI.
 *
 * 202 bytes, 272 base64 characters. It is painted as the image's background so
 * the portrait occupies its final box immediately, then the real AVIF fades in
 * over it. That removes both the blank flash and any layout shift, without
 * ever showing a pixelated *final* image.
 */
export const PORTRAIT_LQIP =
	'data:image/webp;base64,UklGRsIAAABXRUJQVlA4ILYAAAAQBQCdASoYABgAPu1qr1AppaQiqAqpMB2JQBg5v8yJWW0Ngex4fbRa+KelgeOwYQ6gAP5UkG3WB3kfi8EFQkyJEok8P3wD';
