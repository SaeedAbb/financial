package com.basis.api.controller;

import com.basis.api.dto.CreateSavingRequest;
import com.basis.api.dto.SavingDTO;
import com.basis.api.service.SavingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/savings")
@Tag(name = "Savings", description = "Savings management endpoints")
@SecurityRequirement(name = "bearer-key")
public class SavingController {

    private static final Logger logger = LoggerFactory.getLogger(SavingController.class);
    
    private final SavingService savingService;

    public SavingController(SavingService savingService) {
        this.savingService = savingService;
    }

    @PostMapping
    @Operation(summary = "Create a new saving", description = "Creates a new saving entry for the authenticated user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Saving created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "401", description = "User not authenticated")
    })
    public ResponseEntity<SavingDTO> createSaving(
            @Valid @RequestBody CreateSavingRequest request,
            Authentication authentication) {
        
        String userId = getUserId(authentication);
        logger.info("Creating saving for user: {}", userId);
        
        SavingDTO savedSaving = savingService.createSaving(userId, request);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(savedSaving);
    }

    @GetMapping
    @Operation(summary = "Get user's savings", description = "Retrieves all savings for the authenticated user with pagination")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Savings retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "User not authenticated")
    })
    public ResponseEntity<Page<SavingDTO>> getUserSavings(
            @RequestParam(defaultValue = "0") @Parameter(description = "Page number") int page,
            @RequestParam(defaultValue = "10") @Parameter(description = "Page size") int size,
            @RequestParam(defaultValue = "savingDate") @Parameter(description = "Sort field") String sortBy,
            @RequestParam(defaultValue = "desc") @Parameter(description = "Sort direction") String sortDir,
            Authentication authentication) {
        
        String userId = getUserId(authentication);
        logger.debug("Fetching savings for user: {} (page: {}, size: {})", userId, page, size);
        
        Page<SavingDTO> savings = savingService.getUserSavings(userId, page, size, sortBy, sortDir);
        
        return ResponseEntity.ok(savings);
    }

    @GetMapping("/all")
    @Operation(summary = "Get all user's savings", description = "Retrieves all savings for the authenticated user without pagination")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Savings retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "User not authenticated")
    })
    public ResponseEntity<List<SavingDTO>> getAllUserSavings(Authentication authentication) {
        String userId = getUserId(authentication);
        logger.debug("Fetching all savings for user: {}", userId);
        
        List<SavingDTO> savings = savingService.getAllUserSavings(userId);
        
        return ResponseEntity.ok(savings);
    }

    @GetMapping("/{uuid}")
    @Operation(summary = "Get saving by UUID", description = "Retrieves a specific saving by its UUID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Saving retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Saving not found"),
            @ApiResponse(responseCode = "401", description = "User not authenticated")
    })
    public ResponseEntity<SavingDTO> getSavingByUuid(
            @PathVariable @Parameter(description = "Saving UUID") UUID uuid,
            Authentication authentication) {
        
        String userId = getUserId(authentication);
        logger.debug("Fetching saving with UUID: {} for user: {}", uuid, userId);
        
        SavingDTO saving = savingService.getSavingByUuid(userId, uuid);
        
        return ResponseEntity.ok(saving);
    }

    @PutMapping("/{uuid}")
    @Operation(summary = "Update saving", description = "Updates an existing saving")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Saving updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "404", description = "Saving not found"),
            @ApiResponse(responseCode = "401", description = "User not authenticated")
    })
    public ResponseEntity<SavingDTO> updateSaving(
            @PathVariable @Parameter(description = "Saving UUID") UUID uuid,
            @Valid @RequestBody CreateSavingRequest request,
            Authentication authentication) {
        
        String userId = getUserId(authentication);
        logger.info("Updating saving with UUID: {} for user: {}", uuid, userId);
        
        SavingDTO updatedSaving = savingService.updateSaving(userId, uuid, request);
        
        return ResponseEntity.ok(updatedSaving);
    }

    @DeleteMapping("/{uuid}")
    @Operation(summary = "Delete saving", description = "Deletes a saving by its UUID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Saving deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Saving not found"),
            @ApiResponse(responseCode = "401", description = "User not authenticated")
    })
    public ResponseEntity<Void> deleteSaving(
            @PathVariable @Parameter(description = "Saving UUID") UUID uuid,
            Authentication authentication) {
        
        String userId = getUserId(authentication);
        logger.info("Deleting saving with UUID: {} for user: {}", uuid, userId);
        
        savingService.deleteSaving(userId, uuid);
        
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/summary")
    @Operation(summary = "Get savings summary", description = "Retrieves savings summary statistics for the authenticated user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Summary retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "User not authenticated")
    })
    public ResponseEntity<Map<String, Object>> getSavingsSummary(Authentication authentication) {
        String userId = getUserId(authentication);
        logger.debug("Fetching savings summary for user: {}", userId);
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalAmount", savingService.getTotalSavingsAmount(userId));
        summary.put("totalCount", savingService.getSavingsCount(userId));
        summary.put("cashAmount", savingService.getTotalSavingsAmountByType(userId, com.basis.api.entity.SavingType.CASH));
        summary.put("goldAmount", savingService.getTotalSavingsAmountByType(userId, com.basis.api.entity.SavingType.GOLD));
        summary.put("otherAmount", savingService.getTotalSavingsAmountByType(userId, com.basis.api.entity.SavingType.OTHER));
        
        return ResponseEntity.ok(summary);
    }

    /**
     * Extract user ID from JWT token
     */
    private String getUserId(Authentication authentication) {
        if (authentication == null) {
            throw new IllegalArgumentException("Authentication is required");
        }
        
        Jwt jwt = (Jwt) authentication.getPrincipal();
        return jwt.getSubject();
    }
}