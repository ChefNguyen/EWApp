package com.ewa.modules.utility.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class BillQueryRequest {

    @NotBlank(message = "Loại dịch vụ không được để trống")
    private String serviceType;

    @NotBlank(message = "Mã khách hàng không được để trống")
    private String customerId;
}
