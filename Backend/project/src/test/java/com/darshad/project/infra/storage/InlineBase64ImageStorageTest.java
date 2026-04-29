package com.darshad.project.infra.storage;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("InlineBase64ImageStorage")
class InlineBase64ImageStorageTest {

    private final InlineBase64ImageStorage storage = new InlineBase64ImageStorage();

    @Test
    @DisplayName("returns a data: URL containing the base64 of the bytes")
    void encodesAsDataUrl() {
        byte[] bytes = "hello".getBytes();

        String url = storage.store("products/x.png", bytes, "image/png");

        // base64("hello") == "aGVsbG8="
        assertThat(url).isEqualTo("data:image/png;base64,aGVsbG8=");
    }

    @Test
    @DisplayName("isRemote() is false (DB-backed fallback)")
    void notRemote() {
        assertThat(storage.isRemote()).isFalse();
    }

    @Test
    @DisplayName("lowercases content type so the data URL is canonical")
    void lowercasesContentType() {
        String url = storage.store(null, new byte[]{1, 2}, "Image/JPEG");
        assertThat(url).startsWith("data:image/jpeg;base64,");
    }
}
