package com.darshad.project.store;

import com.darshad.project.store.dto.StoreResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StoreService {

    private final StoreRepository storeRepository;

    public List<StoreResponse> getAllActive() {
        return storeRepository.findAllByActiveTrue()
                .stream()
                .map(s -> new StoreResponse(
                        s.getId(),
                        s.getName(),
                        s.getAddress()
                ))
                .toList();
    }

    public StoreResponse getById(UUID id) {
        var store = storeRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("Store not found"));

        return new StoreResponse(
                store.getId(),
                store.getName(),
                store.getAddress()
        );
    }
}