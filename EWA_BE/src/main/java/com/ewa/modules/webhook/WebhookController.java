package com.ewa.modules.webhook;

import com.ewa.modules.payment.sepay.dto.SePayWebhookPayload;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
public class WebhookController {

    private final SePayWebhookProcessor sePayWebhookProcessor;

    /**
     * POST /api/webhooks/sepay
     *
     * Receives SePay sandbox callbacks. This endpoint is public (no JWT required)
     * as SePay cannot send auth headers. Signature verification happens inside processor.
     *
     * Always returns 200 OK to prevent SePay from retrying on 4xx/5xx.
     */
    @PostMapping("/sepay")
    public ResponseEntity<Map<String, String>> handleSePayWebhook(
            @RequestBody String rawBody,
            @RequestHeader(value = "X-SePay-Signature", required = false) String signature,
            HttpServletRequest httpRequest) {

        log.info("[WebhookController] Received SePay webhook from ip={}",
                httpRequest.getRemoteAddr());

        try {
            // Parse to DTO for processing (rawBody is also passed for audit)
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            mapper.findAndRegisterModules(); // handles Instant deserialization
            SePayWebhookPayload payload = mapper.readValue(rawBody, SePayWebhookPayload.class);

            sePayWebhookProcessor.process(payload, signature, rawBody);

        } catch (Exception e) {
            log.error("[WebhookController] Failed to process SePay webhook: {}", e.getMessage(), e);
            // Still return 200 so SePay doesn't retry; error is logged & stored in DB
        }

        return ResponseEntity.ok(Map.of("status", "received"));
    }
}
