package com.darshad.project.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Product images are now stored in PostgreSQL as base64 data URLs (see
 * {@link com.darshad.project.catalog.product.ProductService#uploadImage}),
 * so we no longer expose any local filesystem path.
 *
 * This class is intentionally kept as a no-op WebMvcConfigurer hook in case
 * we add other static asset handlers later.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {
}
