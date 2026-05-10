package com.ewa.modules.utility.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class BillPayRequest {

    private String employeeCode; // injected by controller from JWT

    @NotBlank(message = "Mã hóa đơn không được để trống")
    private String billKey;
}
