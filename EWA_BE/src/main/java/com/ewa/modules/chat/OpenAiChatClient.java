package com.ewa.modules.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;

@Component
@RequiredArgsConstructor
public class OpenAiChatClient {

    private final OpenAiProperties properties;

    public String ask(String systemPrompt, String userPrompt) {
        if (!StringUtils.hasText(properties.getApiKey())) {
            throw new IllegalStateException("OPENAI_API_KEY chưa được cấu hình");
        }

        OpenAiChatRequest request = new OpenAiChatRequest(
                properties.getModel(),
                properties.getTemperature(),
                properties.getMaxTokens(),
                List.of(
                        new OpenAiMessage("system", systemPrompt),
                        new OpenAiMessage("user", userPrompt)
                )
        );

        OpenAiChatResponse response = WebClient.builder()
                .baseUrl(properties.getBaseUrl())
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + properties.getApiKey())
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build()
                .post()
                .uri("/chat/completions")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(OpenAiChatResponse.class)
                .block();

        if (response == null || response.choices() == null || response.choices().isEmpty()) {
            throw new IllegalStateException("OpenAI không trả về nội dung phản hồi");
        }

        OpenAiMessage message = response.choices().get(0).message();
        if (message == null || !StringUtils.hasText(message.content())) {
            throw new IllegalStateException("OpenAI trả về phản hồi rỗng");
        }
        return message.content().trim();
    }

    private record OpenAiChatRequest(
            String model,
            double temperature,
            int max_tokens,
            List<OpenAiMessage> messages
    ) {
    }

    private record OpenAiMessage(String role, String content) {
    }

    private record OpenAiChatResponse(List<OpenAiChoice> choices) {
    }

    private record OpenAiChoice(OpenAiMessage message) {
    }
}
