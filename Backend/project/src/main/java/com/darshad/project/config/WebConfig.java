package com.darshad.project.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * B8: Serves product images that the merchant uploaded via
 * {@code POST /api/admin/products/{id}/image}.
 *
 * The on-disk directory is configurable via {@code app.uploads.dir} so
 * dev (./uploads) and prod (a persistent volume) can differ. The URL
 * prefix is also configurable; by default uploaded files are reachable
 * at {@code /uploads/<filename>}.
 *
 * The trailing slash on the location is required by Spring's
 * FileSystemResourceLoader for directory-style resolution.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final String uploadsDir;
    private final String publicBaseUrl;

    public WebConfig(
            @Value("${app.uploads.dir}") String uploadsDir,
            @Value("${app.uploads.public-base-url}") String publicBaseUrl
    ) {
        this.uploadsDir = uploadsDir;
        this.publicBaseUrl = publicBaseUrl;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path absolute = Paths.get(uploadsDir).toAbsolutePath().normalize();
        String location = "file:" + absolute + "/";
        String pattern = stripTrailingSlash(publicBaseUrl) + "/**";
        registry.addResourceHandler(pattern)
                .addResourceLocations(location);
    }

    private static String stripTrailingSlash(String s) {
        return s.endsWith("/") ? s.substring(0, s.length() - 1) : s;
    }
}
