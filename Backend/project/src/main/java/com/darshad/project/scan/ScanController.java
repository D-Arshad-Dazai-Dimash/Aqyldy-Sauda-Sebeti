package com.darshad.project.scan;

import com.darshad.project.scan.dto.ScanRequest;
import com.darshad.project.scan.dto.ScanResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/scan")
@RequiredArgsConstructor
public class ScanController {

    private final ScanService scanService;

    @PostMapping
    public ScanResponse scan(@RequestBody ScanRequest request) {
        return scanService.scan(request);
    }
}