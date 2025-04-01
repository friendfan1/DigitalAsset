package com.wpf.DigitalAsset.dto;

import com.wpf.DigitalAsset.dao.AssetCertificationRequest;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

@Data
public class CertificationRecordsQueryDTO {
    @Min(value = 1, message = "页码不能小于1")
    @NotNull(message = "页码不能为空")
    private Integer page = 1;  // 默认值

    @Min(value = 1, message = "每页数量不能小于1")
    @Max(value = 100, message = "每页数量不能超过100")
    @NotNull(message = "每页数量不能为空")
    private Integer pageSize = 10;  // 默认值


    private AssetCertificationRequest.RequestStatus status;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate startDate;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate endDate;

    public boolean isValidDateRange() {
        if (startDate != null && endDate != null) {
            return !endDate.isBefore(startDate);
        }
        return true;
    }
}
