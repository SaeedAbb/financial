package com.basis.api.repository;

import com.basis.api.entity.Saving;
import com.basis.api.entity.SavingType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SavingRepository extends JpaRepository<Saving, Long> {

    /**
     * Find all savings for a specific user with pagination
     */
    Page<Saving> findByUserIdOrderBySavingDateDesc(String userId, Pageable pageable);

    /**
     * Find all savings for a specific user
     */
    List<Saving> findByUserIdOrderBySavingDateDesc(String userId);

    /**
     * Find a specific saving by UUID and user ID
     *
     */
    Optional<Saving> findByUuidAndUserId(UUID uuid, String userId);

    /**
     * Find savings by user ID and type
     */
    List<Saving> findByUserIdAndSavingTypeOrderBySavingDateDesc(String userId, SavingType savingType);

    /**
     * Find savings by user ID within a date range
     */
    List<Saving> findByUserIdAndSavingDateBetweenOrderBySavingDateDesc(
            String userId, LocalDate startDate, LocalDate endDate);

    /**
     * Get total savings amount by user ID
     */
    @Query("SELECT COALESCE(SUM(s.amount), 0) FROM Saving s WHERE s.userId = :userId")
    BigDecimal getTotalSavingsAmountByUserId(@Param("userId") String userId);

    /**
     * Get total savings amount by user ID and type
     */
    @Query("SELECT COALESCE(SUM(s.amount), 0) FROM Saving s WHERE s.userId = :userId AND s.savingType = :type")
    BigDecimal getTotalSavingsAmountByUserIdAndType(@Param("userId") String userId, @Param("type") SavingType type);

    /**
     * Count savings entries by user ID
     */
    long countByUserId(String userId);

    /**
     * Delete a saving by UUID and user ID (for security)
     */
    void deleteByUuidAndUserId(UUID uuid, String userId);

    
    /**
     * Check if a saving exists for a user
     */
    boolean existsByUuidAndUserId(UUID uuid, String userId);
}