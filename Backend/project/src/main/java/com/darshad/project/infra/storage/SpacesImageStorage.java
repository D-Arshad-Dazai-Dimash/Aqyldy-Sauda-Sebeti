package com.darshad.project.infra.storage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.ObjectCannedACL;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.net.URI;
import java.util.UUID;

/**
 * S3-compatible object store backed by DigitalOcean Spaces.
 *
 * Configuration is taken from environment variables wired through
 * {@link com.darshad.project.config.ImageStorageConfig}:
 *   SPACES_ENDPOINT      e.g. https://fra1.digitaloceanspaces.com
 *   SPACES_REGION        e.g. fra1
 *   SPACES_BUCKET        bucket name
 *   SPACES_KEY           access key
 *   SPACES_SECRET        secret key
 *   SPACES_PUBLIC_BASE   optional CDN base URL (defaults to
 *                        https://&lt;bucket&gt;.&lt;region&gt;.digitaloceanspaces.com)
 *
 * Uploaded objects are made public-read so that {@code <Image src=...>}
 * tags work without signed URLs.
 */
public class SpacesImageStorage implements ImageStorage {

    private static final Logger log = LoggerFactory.getLogger(SpacesImageStorage.class);

    private final S3Client s3;
    private final String bucket;
    private final String publicBase;

    public SpacesImageStorage(S3Client s3, String bucket, String publicBase) {
        this.s3 = s3;
        this.bucket = bucket;
        this.publicBase = stripTrailingSlash(publicBase);
    }

    /**
     * Convenience factory that wires up an {@link S3Client} for Spaces and
     * resolves a public base URL.
     */
    public static SpacesImageStorage create(String endpoint,
                                            String region,
                                            String bucket,
                                            String accessKey,
                                            String secretKey,
                                            String publicBaseOverride) {

        var creds = AwsBasicCredentials.create(accessKey, secretKey);
        var s3 = S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(creds))
                // Spaces uses path-style addressing more reliably than
                // virtual-host style (especially across regions/CDN).
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build())
                .build();

        String publicBase = (publicBaseOverride == null || publicBaseOverride.isBlank())
                ? defaultPublicBase(endpoint, bucket)
                : publicBaseOverride;

        return new SpacesImageStorage(s3, bucket, publicBase);
    }

    @Override
    public String store(String keyHint, byte[] bytes, String contentType) {
        String key = (keyHint == null || keyHint.isBlank())
                ? "products/" + UUID.randomUUID()
                : keyHint;

        var request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(contentType)
                .acl(ObjectCannedACL.PUBLIC_READ)
                .cacheControl("public, max-age=31536000, immutable")
                .build();

        s3.putObject(request, RequestBody.fromBytes(bytes));
        String url = publicBase + "/" + key;
        log.info("✓ uploaded image to Spaces: bucket={}, key={}, bytes={}", bucket, key, bytes.length);
        return url;
    }

    @Override
    public boolean isRemote() {
        return true;
    }

    private static String defaultPublicBase(String endpoint, String bucket) {
        // endpoint = https://fra1.digitaloceanspaces.com  →
        //   public  = https://<bucket>.fra1.digitaloceanspaces.com
        String stripped = endpoint.replaceFirst("^https?://", "");
        return "https://" + bucket + "." + stripTrailingSlash(stripped);
    }

    private static String stripTrailingSlash(String s) {
        if (s == null) return null;
        return s.endsWith("/") ? s.substring(0, s.length() - 1) : s;
    }
}
