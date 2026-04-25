package com.darshad.project.admin;

import com.darshad.project.catalog.product.Product;
import com.darshad.project.catalog.product.ProductRepository;
import com.darshad.project.store.InventoryId;
import com.darshad.project.store.InventoryRepository;
import com.darshad.project.store.Store;
import com.darshad.project.store.StoreRepository;
import com.darshad.project.store.dto.Inventory;
import com.darshad.project.user.Role;
import com.darshad.project.user.User;
import com.darshad.project.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("InventoryAdminService — ТЗ-12")
class InventoryAdminServiceTest {

    @Mock InventoryRepository inventoryRepo;
    @Mock StoreRepository storeRepo;
    @Mock ProductRepository productRepo;
    @Mock UserRepository userRepo;

    @InjectMocks InventoryAdminService inventoryAdminService;

    UUID storeId, productId;
    UUID ownerId;
    String email;
    User owner;
    Store store;
    Product product;
    Inventory inventory;

    @BeforeEach
    void setUp() {
        storeId   = UUID.randomUUID();
        productId = UUID.randomUUID();
        ownerId = UUID.randomUUID();
        email = "merchant@test.com";

        owner = User.builder().id(ownerId).email(email).role(Role.MERCHANT).enabled(true).build();

        store = Store.builder().id(storeId).name("Test Store").ownerId(ownerId).active(true).build();
        product = Product.builder().id(productId).title("Test Product")
                .price(BigDecimal.valueOf(100)).barcode("123456").build();

        inventory = Inventory.builder()
                .id(new InventoryId(storeId, productId))
                .store(store)
                .product(product)
                .quantity(10)
                .build();
    }

    // ===== GET =====

    @Test
    @DisplayName("getInventory — возвращает список инвентаря для магазина")
    void getInventory_returnsList() {
        when(userRepo.findByEmail(email)).thenReturn(Optional.of(owner));
        when(storeRepo.findById(storeId)).thenReturn(Optional.of(store));
        when(inventoryRepo.findWithProductByStore_Id(storeId)).thenReturn(List.of(inventory));

        var result = inventoryAdminService.getInventory(email, storeId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).productId()).isEqualTo(productId);
        assertThat(result.get(0).quantity()).isEqualTo(10);
    }

    @Test
    @DisplayName("getInventory — бросает исключение если магазин не найден")
    void getInventory_throwsWhenStoreNotFound() {
        when(userRepo.findByEmail(email)).thenReturn(Optional.of(owner));
        when(storeRepo.findById(storeId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> inventoryAdminService.getInventory(email, storeId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Store not found");
    }

    // ===== PATCH (upsert quantity) =====

    @Test
    @DisplayName("upsertInventory — обновляет quantity если строка уже существует")
    void upsertInventory_updatesExisting() {
        when(userRepo.findByEmail(email)).thenReturn(Optional.of(owner));
        when(storeRepo.findById(storeId)).thenReturn(Optional.of(store));
        when(productRepo.findById(productId)).thenReturn(Optional.of(product));
        when(inventoryRepo.findByStore_IdAndProduct_Id(storeId, productId))
                .thenReturn(Optional.of(inventory));
        when(inventoryRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var result = inventoryAdminService.upsertInventory(email, storeId, productId, 25);

        assertThat(result.quantity()).isEqualTo(25);
        verify(inventoryRepo).save(any(Inventory.class));
    }

    @Test
    @DisplayName("upsertInventory — создаёт новую строку если не существует")
    void upsertInventory_createsNew() {
        when(userRepo.findByEmail(email)).thenReturn(Optional.of(owner));
        when(storeRepo.findById(storeId)).thenReturn(Optional.of(store));
        when(productRepo.findById(productId)).thenReturn(Optional.of(product));
        when(inventoryRepo.findByStore_IdAndProduct_Id(storeId, productId))
                .thenReturn(Optional.empty());
        when(inventoryRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var result = inventoryAdminService.upsertInventory(email, storeId, productId, 50);

        assertThat(result.quantity()).isEqualTo(50);
        verify(inventoryRepo).save(any(Inventory.class));
    }

    @Test
    @DisplayName("upsertInventory — бросает если quantity отрицательный")
    void upsertInventory_throwsOnNegativeQuantity() {
        when(userRepo.findByEmail(email)).thenReturn(Optional.of(owner));
        when(storeRepo.findById(storeId)).thenReturn(Optional.of(store));
        assertThatThrownBy(() -> inventoryAdminService.upsertInventory(email, storeId, productId, -1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("quantity");
    }
}
