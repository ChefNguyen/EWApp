package com.ewa.modules.chat;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "openai")
public class OpenAiProperties {

    private String baseUrl;
    private String apiKey;
    private String model;
    private int maxTokens = 500;
    private double temperature = 0.2;
}
