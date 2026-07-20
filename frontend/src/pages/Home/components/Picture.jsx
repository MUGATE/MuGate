/**
 * Prefer AVIF with WebP fallback for Home showcase media.
 */
export default function Picture({
  webp,
  avif,
  alt = "",
  className,
  loading = "lazy",
  decoding = "async",
  ...rest
}) {
  if (!avif) {
    return (
      <img
        src={webp}
        alt={alt}
        className={className}
        loading={loading}
        decoding={decoding}
        {...rest}
      />
    );
  }

  return (
    <picture>
      <source srcSet={avif} type="image/avif" />
      <source srcSet={webp} type="image/webp" />
      <img
        src={webp}
        alt={alt}
        className={className}
        loading={loading}
        decoding={decoding}
        {...rest}
      />
    </picture>
  );
}
