package com.indigo.smarttravel.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.indigo.smarttravel.config.JwtUtil;
import com.indigo.smarttravel.dto.AuthResponse;
import com.indigo.smarttravel.entity.User;
import com.indigo.smarttravel.service.UserService;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        try {
            User registeredUser = userService.registerUser(user.getName(), user.getEmail(), user.getPassword());
            Map<String, Object> response = new HashMap<>();
            response.put("message", "User registered successfully");
            response.put("user", registeredUser);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/login")
public ResponseEntity<?> loginUser(@RequestBody Map<String, String> credentials) {

    try {

        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                credentials.get("email"),
                credentials.get("password")
            )
        );

        UserDetails userDetails = userService.findByEmail(credentials.get("email"))
                .map(u -> org.springframework.security.core.userdetails.User
                        .withUsername(u.getEmail())
                        .password(u.getPassword())
                        .roles(u.getRole())
                        .build())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtUtil.generateToken(userDetails.getUsername());

        return ResponseEntity.ok(
            new AuthResponse(
                userDetails.getUsername(),
                "USER",
                token
            )
        );

    } catch (Exception e) {

        Map<String, String> error = new HashMap<>();
        error.put("error", "Invalid credentials");

        return ResponseEntity.badRequest().body(error);
    }
}

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Password reset link sent to your email");
        return ResponseEntity.ok(response);
    }
}