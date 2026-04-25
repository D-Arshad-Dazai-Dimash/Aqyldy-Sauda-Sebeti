package com.darshad.project.store;

import com.darshad.project.store.dto.StoreResponse;
import com.darshad.project.user.User;
import com.darshad.project.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("StoreService — ТЗ-14: getMyStores")
class StoreServiceTest {

    @Mock StoreRepository storeRepository;
    @Mock InventoryRepository inventoryRepository;
    @Mock UserRepository userRepository;

    @InjectMocks StoreService storeService;

    UUID ownerId;
    User owner;
    Store store1, store2;

    @BeforeEach
    void setUp() {
        ownerId = UUID.randomUUID();
        owner = User.builder().id(ownerId).email("merchant@test.com").build();

        store1 = Store.builder().id(UUID.randomUUID()).name("Shop A")
                .ownerId(ownerId).active(true).build();
        store2 = Store.builder().id(UUID.randomUUID()).name("Shop B")
                .ownerId(ownerId).active(true).build();
    }

    @Test
    @DisplayName("getMyStores — возвращает все магазины текущего мерчанта")
    void getMyStores_returnsMerchantsStores() {
        when(userRepository.findByEmail("merchant@test.com")).thenReturn(Optional.of(owner));
        when(storeRepository.findByOwnerId(ownerId)).thenReturn(List.of(store1, store2));

        List<StoreResponse> result = storeService.getMyStores("merchant@test.com");

        assertThat(result).hasSize(2);
        assertThat(result).extracting(StoreResponse::name)
                .containsExactlyInAnyOrder("Shop A", "Shop B");
    }

    @Test
    @DisplayName("getMyStores — возвращает пустой список если магазинов нет")
    void getMyStores_returnsEmptyWhenNoStores() {
        when(userRepository.findByEmail("merchant@test.com")).thenReturn(Optional.of(owner));
        when(storeRepository.findByOwnerId(ownerId)).thenReturn(List.of());

        List<StoreResponse> result = storeService.getMyStores("merchant@test.com");

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getMyStores — бросает исключение если пользователь не найден")
    void getMyStores_throwsWhenUserNotFound() {
        when(userRepository.findByEmail("unknown@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> storeService.getMyStores("unknown@test.com"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("User not found");
    }

        @Test
        @DisplayName("getNearby — фильтрует только активные магазины с координатами в радиусе")
        void getNearby_filtersByRadiusAndCoordinates() {
        Store near = Store.builder()
            .id(UUID.randomUUID())
            .name("Near")
            .address("A")
            .active(true)
            .latitude(51.1695)
            .longitude(71.4492)
            .build();
        Store far = Store.builder()
            .id(UUID.randomUUID())
            .name("Far")
            .address("B")
            .active(true)
            .latitude(51.2500)
            .longitude(71.6000)
            .build();
        Store noCoords = Store.builder()
            .id(UUID.randomUUID())
            .name("NoCoords")
            .active(true)
            .latitude(null)
            .longitude(null)
            .build();

        when(storeRepository.findAllByActiveTrue()).thenReturn(List.of(near, far, noCoords));

        List<StoreResponse> result = storeService.getNearby(51.1694, 71.4491, 2_000);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).name()).isEqualTo("Near");
        assertThat(result.get(0).latitude()).isEqualTo(51.1695);
        assertThat(result.get(0).longitude()).isEqualTo(71.4492);
        }

        @Test
        @DisplayName("getNearby — возвращает магазины по возрастанию расстояния")
        void getNearby_returnsSortedByDistance() {
        Store closest = Store.builder()
            .id(UUID.randomUUID())
            .name("Closest")
            .active(true)
            .latitude(51.16941)
            .longitude(71.44911)
            .build();
        Store middle = Store.builder()
            .id(UUID.randomUUID())
            .name("Middle")
            .active(true)
            .latitude(51.1700)
            .longitude(71.4500)
            .build();

        when(storeRepository.findAllByActiveTrue()).thenReturn(List.of(middle, closest));

        List<StoreResponse> result = storeService.getNearby(51.1694, 71.4491, 20_000);

        assertThat(result).extracting(StoreResponse::name)
            .containsExactly("Closest", "Middle");
        }
}
