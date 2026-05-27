package com.indigo.smarttravel.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.indigo.smarttravel.entity.Coupon;
import com.indigo.smarttravel.repository.CouponRepository;

@Service
public class CouponService {

    @Autowired
    private CouponRepository couponRepository;

    public List<Coupon> getAllActiveCoupons() {
        return couponRepository.findByActiveTrue();
    }

    public List<Coupon> getCouponsByType(String type) {
        return couponRepository.findByCouponType(type);
    }

    public Optional<Coupon> getCouponByCode(String code) {
        return couponRepository.findByCode(code);
    }

    public BigDecimal validateAndApplyCoupon(String code, BigDecimal bookingAmount) {
        Coupon coupon = couponRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Invalid coupon code"));

        if (!coupon.isActive()) {
            throw new RuntimeException("Coupon is not active");
        }

        Integer usageLimit = coupon.getUsageLimit();
        if (usageLimit != null && usageLimit > 0 && coupon.getUsageCount() >= usageLimit) {
            throw new RuntimeException("Coupon usage limit exceeded");
        }

        java.math.BigDecimal minBookingAmount = coupon.getMinBookingAmount();
        if (minBookingAmount != null && bookingAmount.compareTo(minBookingAmount) < 0) {
            throw new RuntimeException("Booking amount below minimum required for coupon");
        }

        return coupon.calculateDiscount(bookingAmount);
    }

    public Coupon createCoupon(Coupon coupon) {
        return couponRepository.save(coupon);
    }
}