package com.ewa.modules.payment.sepay;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "sepay")
@Getter
@Setter
public class SePayProperties {

    private String baseUrl = "https://bankhub-api-sandbox.sepay.vn";
    private String apiKey = "";
    private String webhookSecret = "";
}
