package com.darshad.project.catalog;

import com.darshad.project.catalog.category.CategoryService;
import com.darshad.project.catalog.product.BatchRequest;
import com.darshad.project.catalog.product.ProductDto;
import com.darshad.project.catalog.product.ProductService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("CatalogPublicController")
class CatalogPublicControllerTest {

    @Mock
    private CategoryService categoryService;

    @Mock
    private ProductService productService;

    @Test
    @DisplayName("productsBatch returns only requested ids")
    void productsBatch() {
        UUID first = UUID.randomUUID();
        UUID second = UUID.randomUUID();

        ProductDto p1 = new ProductDto(first, "Milk", null, BigDecimal.TEN, null, 1, null, null, null, null, true, List.of(), null, null, null);
        ProductDto p2 = new ProductDto(second, "Bread", null, BigDecimal.ONE, null, 1, null, null, null, null, true, List.of(), null, null, null);

        when(productService.findAllByIds(List.of(first, second))).thenReturn(List.of(p1, p2));

        var controller = new CatalogPublicController(categoryService, productService);
        List<ProductDto> result = controller.productsBatch(new BatchRequest(List.of(first, second)));

        assertThat(result).hasSize(2);
        assertThat(result.get(0).id()).isEqualTo(first);
        assertThat(result.get(1).id()).isEqualTo(second);
    }
}
