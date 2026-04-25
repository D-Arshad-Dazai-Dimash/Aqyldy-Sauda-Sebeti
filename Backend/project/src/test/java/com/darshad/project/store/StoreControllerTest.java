package com.darshad.project.store;

import com.darshad.project.store.dto.StoreResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("StoreController")
class StoreControllerTest {

    @Mock
    private StoreService storeService;

    @Test
    @DisplayName("getNearby delegates to service with same params")
    void getNearby_delegatesToService() {
        var expected = List.of(
                new StoreResponse(UUID.randomUUID(), "A", "Addr", null, null, null, null, 51.1694, 71.4491)
        );
        when(storeService.getNearby(51.1694, 71.4491, 5000)).thenReturn(expected);

        var controller = new StoreController(storeService);
        List<StoreResponse> actual = controller.getNearby(51.1694, 71.4491, 5000);

        assertThat(actual).isEqualTo(expected);
        verify(storeService).getNearby(51.1694, 71.4491, 5000);
    }
}
