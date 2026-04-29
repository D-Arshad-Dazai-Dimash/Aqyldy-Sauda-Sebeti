package com.darshad.project.infra.storage;

import java.util.Base64;

/**
 * Default {@link ImageStorage} that turns the bytes into a
 * {@code data:image/...;base64,...} URL and lets the database hold them.
 *
 * Used when no Spaces credentials are configured — preserves the
 * pre-existing behavior so deployments without object storage keep
 * working.
 */
public class InlineBase64ImageStorage implements ImageStorage {

    @Override
    public String store(String keyHint, byte[] bytes, String contentType) {
        String base64 = Base64.getEncoder().encodeToString(bytes);
        return "data:" + contentType.toLowerCase() + ";base64," + base64;
    }

    @Override
    public boolean isRemote() {
        return false;
    }
}
