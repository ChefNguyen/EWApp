package com.ewa;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties
public class EwaApplication {

    public static void main(String[] args) {
        SpringApplication.run(EwaApplication.class, args);
    }
}
