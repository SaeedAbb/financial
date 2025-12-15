package com.basis.api.service;

import com.basis.api.dto.CreateSavingRequest;
import com.basis.api.dto.SavingDTO;
import com.basis.api.entity.Saving;
import com.basis.api.entity.SavingType;
import com.basis.api.exception.ResourceNotFoundException;
import com.basis.api.repository.SavingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class SavingService {

    private static final Logger logger = LoggerFactory.getLogger(SavingService.class);
    
    private final SavingRepository savingRepository;

    public SavingService(SavingRepository savingRepository) {
        this.savingRepository = savingRepository;
    }

    /**
     * Create a new saving entry
     */
    public SavingDTO createSaving(String userId, CreateSavingRequest request) {
        logger.info("Creating new saving for user: {}", userId);
        
        Saving saving = new Saving(
                userId,
                request.getAmount(),
                request.getSavingType(),
                request.getSavingDate(),
                request.getComments()
        );
        
        saving = savingRepository.save(saving);
        logger.info("Created saving with UUID: {} for user: {}", saving.getUuid(), userId);
        
        return convertToDTO(saving);
    }

    /**
     * Get all savings for a user with pagination
     */
    @Transactional(readOnly = true)
    public Page<SavingDTO> getUserSavings(String userId, int page, int size, String sortBy, String sortDir) {
        logger.debug("Fetching savings for user: {} (page: {}, size: {})", userId, page, size);
        
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<Saving> savingsPage = savingRepository.findByUserIdOrderBySavingDateDesc(userId, pageable);
        
        return savingsPage.map(this::convertToDTO);
    }

    /**
     * Get all savings for a user (no pagination)
     */
    @Transactional(readOnly = true)
    public List<SavingDTO> getAllUserSavings(String userId) {
        logger.debug("Fetching all savings for user: {}", userId);
        
        List<Saving> savings = savingRepository.findByUserIdOrderBySavingDateDesc(userId);
        
        return savings.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get a specific saving by UUID
     */
    @Transactional(readOnly = true)
    public SavingDTO getSavingByUuid(String userId, UUID uuid) {
        logger.debug("Fetching saving with UUID: {} for user: {}", uuid, userId);
        
        Saving saving = savingRepository.findByUuidAndUserId(uuid, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Saving not found with UUID: " + uuid));
        
        return convertToDTO(saving);
    }

    /**
     * Update an existing saving
     */
    public SavingDTO updateSaving(String userId, UUID uuid, CreateSavingRequest request) {
        logger.info("Updating saving with UUID: {} for user: {}", uuid, userId);
        
        Saving saving = savingRepository.findByUuidAndUserId(uuid, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Saving not found with UUID: " + uuid));
        
        saving.setAmount(request.getAmount());
        saving.setSavingType(request.getSavingType());
        saving.setSavingDate(request.getSavingDate());
        saving.setComments(request.getComments());
        
        saving = savingRepository.save(saving);
        logger.info("Updated saving with UUID: {} for user: {}", uuid, userId);
        
        return convertToDTO(saving);
    }

    /**
     * Delete a saving
     */
    public void deleteSaving(String userId, UUID uuid) {
        logger.info("Deleting saving with UUID: {} for user: {}", uuid, userId);
        
        if (!savingRepository.existsByUuidAndUserId(uuid, userId)) {
            throw new ResourceNotFoundException("Saving not found with UUID: " + uuid);
        }
        
        savingRepository.deleteByUuidAndUserId(uuid, userId);
        logger.info("Deleted saving with UUID: {} for user: {}", uuid, userId);
    }

    /**
     * Get total savings amount for a user
     */
    @Transactional(readOnly = true)
    public BigDecimal getTotalSavingsAmount(String userId) {
        logger.debug("Calculating total savings for user: {}", userId);
        return savingRepository.getTotalSavingsAmountByUserId(userId);
    }

    /**
     * Get total savings amount by type for a user
     */
    @Transactional(readOnly = true)
    public BigDecimal getTotalSavingsAmountByType(String userId, SavingType type) {
        logger.debug("Calculating total {} savings for user: {}", type, userId);
        return savingRepository.getTotalSavingsAmountByUserIdAndType(userId, type);
    }

    /**
     * Get savings count for a user
     */
    @Transactional(readOnly = true)
    public long getSavingsCount(String userId) {
        logger.debug("Counting savings for user: {}", userId);
        return savingRepository.countByUserId(userId);
    }

    /**
     * Get savings within date range
     */
    @Transactional(readOnly = true)
    public List<SavingDTO> getSavingsInDateRange(String userId, LocalDate startDate, LocalDate endDate) {
        logger.debug("Fetching savings for user: {} between {} and {}", userId, startDate, endDate);
        
        List<Saving> savings = savingRepository.findByUserIdAndSavingDateBetweenOrderBySavingDateDesc(
                userId, startDate, endDate);
        
        return savings.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Convert Saving entity to SavingDTO
     */
    private SavingDTO convertToDTO(Saving saving) {
        return new SavingDTO(
                saving.getId(),
                saving.getUuid(),
                saving.getAmount(),
                saving.getSavingType(),
                saving.getSavingDate(),
                saving.getComments(),
                saving.getCreatedAt(),
                saving.getUpdatedAt()
        );
    }
}