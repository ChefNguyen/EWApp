package com.ewa.modules.chat;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class GeminiChatClient {

    private final GeminiProperties properties;

    private static final int MAX_RETRIES = 3;
    private static final long[] RETRY_DELAYS = {2000, 4000, 8000}; // ms

    public String ask(String systemPrompt, String userPrompt) {
        if (!StringUtils.hasText(properties.getApiKey())) {
            throw new IllegalStateException("GEMINI_API_KEY chưa được cấu hình");
        }

        String combinedPrompt = systemPrompt + "\n\n" + userPrompt;

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", combinedPrompt)
                        ))
                ),
                "generationConfig", Map.of(
                        "maxOutputTokens", properties.getMaxTokens(),
                        "temperature", properties.getTemperature()
                )
        );

        String uri = String.format("/models/%s:generateContent?key=%s",
                properties.getModel(), properties.getApiKey());

        for (int attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                GeminiResponse response = WebClient.builder()
                        .baseUrl(properties.getBaseUrl())
                        .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                        .build()
                        .post()
                        .uri(uri)
                        .bodyValue(requestBody)
                        .retrieve()
                        .bodyToMono(GeminiResponse.class)
                        .block();

                if (response == null || response.candidates() == null || response.candidates().isEmpty()) {
                    throw new IllegalStateException("Gemini không trả về nội dung phản hồi");
                }

                List<Map<String, Object>> parts = response.candidates().get(0).content().parts();
                if (parts == null || parts.isEmpty()) {
                    throw new IllegalStateException("Gemini trả về phản hồi rỗng");
                }

                String content = (String) parts.get(0).get("text");
                if (!StringUtils.hasText(content)) {
                    throw new IllegalStateException("Gemini trả về nội dung rỗng");
                }

                return content.trim();

            } catch (WebClientResponseException e) {
                if (e.getStatusCode().value() == 429 && attempt < MAX_RETRIES) {
                    long delay = RETRY_DELAYS[attempt];
                    log.warn("Gemini rate limited. Retrying in {}ms (attempt {}/{})", delay, attempt + 1, MAX_RETRIES);
                    try {
                        Thread.sleep(delay);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new IllegalStateException("Retry bị gián đoạn");
                    }
                } else {
                    log.error("Gemini API error: {} {}", e.getStatusCode(), e.getResponseBodyAsString());
                    throw new IllegalStateException("Gemini API error: " + e.getStatusCode());
                }
            }
        }

        throw new IllegalStateException("Gemini rate limit exceeded after " + MAX_RETRIES + " retries");
    }

    private record GeminiResponse(List<Candidate> candidates) {}
    private record Candidate(Content content) {}
    private record Content(List<Map<String, Object>> parts) {}
}
