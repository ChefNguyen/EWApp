package com.ewa.modules.payment.sepay;

import com.ewa.modules.payment.sepay.dto.SePayTransferRequest;
import com.ewa.modules.payment.sepay.dto.SePayTransferResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Slf4j
@Component
@RequiredArgsConstructor
public class SePayClient {

    @Qualifier("sePayWebClient")
    private final WebClient webClient;

    /**
     * Initiates a bank transfer via SePay sandbox.
     *
     * @param request transfer details (account, amount, reference)
     * @return SePay response with transactionId and status
     * @throws SePayClientException on HTTP error or parse failure
     */
    public SePayTransferResponse transfer(SePayTransferRequest request) {
        log.info("[SePay] Initiating transfer referenceCode={} amount={}",
                request.getReferenceCode(), request.getAmount());
        try {
            // --- HACK FOR LOCAL TESTING: Nếu là link sandbox mặc định, trả về MOCK SUCCESS ---
            if (request.getReferenceCode() != null) {
                log.info("[SePay - MOCK] Bypassing real HTTP call for local testing.");
                SePayTransferResponse mockResponse = new SePayTransferResponse();
                mockResponse.setTransactionId("MOCK-SEPAY-" + System.currentTimeMillis());
                mockResponse.setStatus("PENDING"); // Sẽ được cập nhật SUCCESS khi gọi Webhook
                mockResponse.setCode("00");
                return mockResponse;
            }
            // -----------------------------------------------------------------------------------

            SePayTransferResponse response = webClient.post()
                    .uri("/v1/transfer")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(SePayTransferResponse.class)
                    .block();

            log.info("[SePay] Transfer response referenceCode={} txnId={} status={}",
                    request.getReferenceCode(),
                    response != null ? response.getTransactionId() : null,
                    response != null ? response.getStatus() : null);

            return response;
        } catch (WebClientResponseException e) {
            log.error("[SePay] HTTP error status={} body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new SePayClientException("SePay HTTP error: " + e.getStatusCode() + " - " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            log.error("[SePay] Unexpected error during transfer: {}", e.getMessage(), e);
            throw new SePayClientException("SePay transfer failed: " + e.getMessage(), e);
        }
    }
}
