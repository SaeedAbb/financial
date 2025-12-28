package com.basis.api.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Profile;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.web.SecurityFilterChain;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@TestConfiguration
@EnableWebSecurity
@Profile("test")
public class TestSecurityConfig {

    @Bean
    public SecurityFilterChain testSecurityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.decoder(mockJwtDecoder()))
            );
        
        return http.build();
    }
    
    @Bean
    public JwtDecoder mockJwtDecoder() {
        return new JwtDecoder() {
            @Override
            public Jwt decode(String token) throws JwtException {
                // For testing, return a simple JWT with the subject from the test
                Map<String, Object> headers = new HashMap<>();
                headers.put("alg", "HS256");
                headers.put("typ", "JWT");
                
                Map<String, Object> claims = new HashMap<>();
                // Extract subject from the JWT builder in tests
                if (token != null && token.contains("test-user")) {
                    claims.put("sub", "test-user-123");
                }
                
                return new Jwt(
                    token,
                    Instant.now(),
                    Instant.now().plusSeconds(3600),
                    headers,
                    claims
                );
            }
        };
    }
}