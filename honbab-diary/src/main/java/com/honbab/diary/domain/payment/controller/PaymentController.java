package com.honbab.diary.domain.payment.controller;

import com.honbab.diary.domain.payment.dto.PaymentApproveRequest;
import com.honbab.diary.domain.payment.dto.PaymentReadyRequest;
import com.honbab.diary.domain.payment.dto.PaymentReadyResponse;
import com.honbab.diary.domain.payment.service.PaymentService;
import com.honbab.diary.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "결제", description = "카카오페이 결제 API")
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @Operation(summary = "결제 준비", description = "카카오페이 결제를 준비합니다.")
    @PostMapping("/ready")
    public ResponseEntity<ApiResponse<PaymentReadyResponse>> readyPayment(
            @Valid @RequestBody PaymentReadyRequest request,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(paymentService.readyPayment(request, userId)));
    }

    @Operation(summary = "결제 승인", description = "카카오페이 결제를 승인합니다.")
    @PostMapping("/approve")
    public ResponseEntity<ApiResponse<Void>> approvePayment(
            @Valid @RequestBody PaymentApproveRequest request,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        paymentService.approvePayment(request, userId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @Operation(summary = "결제 취소", description = "결제를 취소합니다.")
    @PostMapping("/{paymentId}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelPayment(
            @PathVariable Long paymentId,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        paymentService.cancelPayment(paymentId, userId);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
