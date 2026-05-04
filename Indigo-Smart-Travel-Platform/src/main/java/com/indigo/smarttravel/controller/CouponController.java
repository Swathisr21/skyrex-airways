package com.indigo.smarttravel.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.indigo.smarttravel.entity.Coupon;
import com.indigo.smarttravel.service.CouponService;

@RestController
@RequestMapping("/coupons")
@CrossOrigin(origins = "*")
public class CouponController {

    @Autowired
    private CouponService couponService;

    @GetMapping
    public ResponseEntity<List<Coupon>> getAllActiveCoupons() {
        return ResponseEntity.ok(couponService.getAllActiveCoupons());
    }

    @GetMapping("/type")
    public ResponseEntity<List<Coupon>> getCouponsByType(@RequestParam String type) {
        return ResponseEntity.ok(couponService.getCouponsByType(type));
    }

    @PostMapping("/validate")
    public ResponseEntity<?> validateCoupon(@RequestBody Map<String, Object> request) {
        String code = request.get("code").toString();
        java.math.BigDecimal bookingAmount = new java.math.BigDecimal(request.get("bookingAmount").toString());
        try {
            java.math.BigDecimal discount = couponService.validateAndApplyCoupon(code, bookingAmount);
            return ResponseEntity.ok(Map.of("valid", true, "discount", discount));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("valid", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/create")
    public ResponseEntity<Coupon> createCoupon(@RequestBody Coupon coupon) {
        return ResponseEntity.ok(couponService.createCoupon(coupon));
    }
}