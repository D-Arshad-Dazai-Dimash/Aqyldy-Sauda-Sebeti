package com.darshad.project.infra.storage;

/**
 * Abstraction over the place where binary product images live.
 *
 * Two implementations exist:
 *   - {@link SpacesImageStorage} — DigitalOcean Spaces (S3 compatible).
 *     Returns a public URL pointing at the CDN/origin endpoint.
 *   - {@link InlineBase64ImageStorage} — fallback used when no Spaces
 *     credentials are configured. Returns a {@code data:} URL the
 *     frontend can render directly. Bigger DB, but zero ops.
 *
 * Implementations MUST validate size and content-type themselves OR
 * trust the caller. The current callers already validate.
 */
public interface ImageStorage {

    /**
     * Persist the given bytes and return a stable, browser-loadable URL.
     *
     * @param keyHint   suggested object key (e.g. "products/uuid.jpg") —
     *                  storage may use it verbatim or ignore it
     * @param bytes     raw image bytes (≤ 5 MB)
     * @param contentType MIME type, lowercased (image/jpeg, image/png, ...)
     * @return public URL ready to be stored in {@code products.image_url}
     */
    String store(String keyHint, byte[] bytes, String contentType);

    /** Whether this storage hits a remote object store (true) or DB (false). */
    boolean isRemote();
}
