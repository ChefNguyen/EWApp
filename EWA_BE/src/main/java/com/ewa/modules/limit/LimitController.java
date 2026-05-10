package com.ewa.modules.limit;

import com.ewa.modules.payment.AvailableLimitService;
import com.ewa.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/limit")
@RequiredArgsConstructor
public class LimitController {

    private final AvailableLimitService availableLimitService;

    @GetMapping
    public ResponseEntity<?> getAvailableLimit() {
        String employeeCode = SecurityUtils.getCurrentEmployeeCode();
        if (employeeCode == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Chưa xác thực"));
        }
        try {
            long limitVnd = availableLimitService.calculateAvailableLimit(employeeCode);
            return ResponseEntity.ok(Map.of("limitVnd", limitVnd));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
