package com.wpf.DigitalAsset.config;

import com.wpf.DigitalAsset.util.TokenManager;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Configuration
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthFilter.class);

    private final TokenManager tokenManager;

    public JwtAuthFilter(TokenManager tokenManager) {
        this.tokenManager = tokenManager;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        try {
            String token = getTokenFromRequest(request);
            if (StringUtils.hasText(token)) {
                Authentication authentication = tokenManager.getAuthentication(token);
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (ExpiredJwtException ex) {
            logger.warn("JWT令牌已过期: {}", ex.getMessage());
            sendError(response, "令牌已过期", HttpStatus.UNAUTHORIZED);
            return;
        } catch (JwtException | IllegalArgumentException ex) {
            logger.warn("无效的JWT令牌: {}", ex.getMessage());
            sendError(response, "无效的访问令牌", HttpStatus.UNAUTHORIZED);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    private void sendError(HttpServletResponse response, String message, HttpStatus status)
            throws IOException {
        response.setContentType("application/json");
        response.setStatus(status.value());
        response.getWriter().write(
                String.format("{ \"success\": false, \"message\": \"%s\" }", message)
        );
    }


}