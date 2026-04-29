package com.darshad.project.infra.storage;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.ObjectCannedACL;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

@DisplayName("SpacesImageStorage")
class SpacesImageStorageTest {

    @Test
    @DisplayName("uploads with public-read ACL and returns CDN URL")
    void uploadsAndReturnsPublicUrl() {
        S3Client s3 = mock(S3Client.class);
        var storage = new SpacesImageStorage(
                s3,
                "aqyldy-images",
                "https://aqyldy-images.fra1.cdn.digitaloceanspaces.com"
        );

        String url = storage.store("products/abc.jpg", new byte[]{1, 2, 3}, "image/jpeg");

        ArgumentCaptor<PutObjectRequest> captor = ArgumentCaptor.forClass(PutObjectRequest.class);
        verify(s3).putObject(captor.capture(), any(RequestBody.class));

        PutObjectRequest req = captor.getValue();
        assertThat(req.bucket()).isEqualTo("aqyldy-images");
        assertThat(req.key()).isEqualTo("products/abc.jpg");
        assertThat(req.contentType()).isEqualTo("image/jpeg");
        assertThat(req.acl()).isEqualTo(ObjectCannedACL.PUBLIC_READ);

        assertThat(url).isEqualTo(
                "https://aqyldy-images.fra1.cdn.digitaloceanspaces.com/products/abc.jpg"
        );
    }

    @Test
    @DisplayName("isRemote() is true")
    void remote() {
        var storage = new SpacesImageStorage(mock(S3Client.class), "b", "https://b/");
        assertThat(storage.isRemote()).isTrue();
    }

    @Test
    @DisplayName("strips trailing slash from public base URL")
    void stripsTrailingSlash() {
        S3Client s3 = mock(S3Client.class);
        var storage = new SpacesImageStorage(s3, "b", "https://cdn.example.com/");

        String url = storage.store("products/x.png", new byte[]{1}, "image/png");

        assertThat(url).isEqualTo("https://cdn.example.com/products/x.png");
    }

    @Test
    @DisplayName("generates a key when keyHint is blank")
    void generatesKeyWhenHintBlank() {
        S3Client s3 = mock(S3Client.class);
        var storage = new SpacesImageStorage(s3, "b", "https://cdn.example.com");

        String url = storage.store("", new byte[]{1}, "image/png");

        assertThat(url).startsWith("https://cdn.example.com/products/");
    }
}
