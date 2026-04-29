package com.darshad.project.config;

import com.darshad.project.infra.storage.ImageStorage;
import com.darshad.project.infra.storage.InlineBase64ImageStorage;
import com.darshad.project.infra.storage.SpacesImageStorage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Wires up the {@link ImageStorage} bean.
 *
 * If all four required Spaces variables (endpoint, region, bucket, key,
 * secret) are present the Spaces backend is used. Otherwise the project
 * falls back to the inline base64 implementation so local development
 * and tests keep working without any external service.
 */
@Configuration
public class ImageStorageConfig {

    private static final Logger log = LoggerFactory.getLogger(ImageStorageConfig.class);

    @Bean
    public ImageStorage imageStorage(
            @Value("${spaces.endpoint:}") String endpoint,
            @Value("${spaces.region:}") String region,
            @Value("${spaces.bucket:}") String bucket,
            @Value("${spaces.key:}") String accessKey,
            @Value("${spaces.secret:}") String secretKey,
            @Value("${spaces.public-base:}") String publicBase
    ) {
        boolean spacesReady = notBlank(endpoint) && notBlank(region) && notBlank(bucket)
                && notBlank(accessKey) && notBlank(secretKey);
        if (spacesReady) {
            log.info("Using DigitalOcean Spaces image storage (bucket={}, region={})", bucket, region);
            return SpacesImageStorage.create(endpoint, region, bucket, accessKey, secretKey, publicBase);
        }
        log.warn("Spaces credentials not configured — falling back to inline base64 image storage. "
                + "Set SPACES_ENDPOINT/REGION/BUCKET/KEY/SECRET to enable object storage.");
        return new InlineBase64ImageStorage();
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }
}
