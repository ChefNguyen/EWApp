package com.ewa.modules.utility.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class BillPayRequest {

    @NotBlank(message = "Mã nhân viên không được để trống")
    private String employeeCode;

    @NotBlank(message = "Mã hóa đơn không được để trống")
    private String billKey;
}
