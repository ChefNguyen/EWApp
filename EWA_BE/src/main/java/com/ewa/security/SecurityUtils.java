package com.ewa.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * Utility to extract the currently-authenticated employee code from Spring Security context.
 */
public final class SecurityUtils {

    private SecurityUtils() {}

    /**
     * Returns the employeeCode of the currently authenticated user, or null if not authenticated.
     * Works when JWT filter has populated SecurityContextHolder.
     */
    public static String getCurrentEmployeeCode() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof UserDetails userDetails) {
            return userDetails.getUsername();
        }
        if (principal instanceof String str) {
            return str;
        }
        return null;
    }
}
