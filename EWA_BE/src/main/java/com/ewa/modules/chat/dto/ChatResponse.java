package com.ewa.modules.chat.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ChatResponse {

    private String employeeCode;
    private String answer;
}
