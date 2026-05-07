package com.ewa.modules.utility.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class TopupRequest {

    @NotBlank(message = "Mã nhân viên không được để trống")
    private String employeeCode;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(0|\\+84)[3-9][0-9]{8}$", message = "Số điện thoại không hợp lệ")
    private String phoneNumber;

    @NotNull(message = "Mệnh giá không được để trống")
    @Positive(message = "Mệnh giá phải lớn hơn 0")
    private Long denomination;
}
