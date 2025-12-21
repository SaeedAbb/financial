package com.basis.api.features.investment;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PortfolioRepository extends JpaRepository<Portfolio, Long> {

    /**
     * Find all portfolios for a specific user with pagination
     */
    Page<Portfolio> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    /**
     * Find all portfolios for a specific user
     */
    List<Portfolio> findByUserIdOrderByCreatedAtDesc(String userId);

    /**
     * Find a specific portfolio by UUID and user ID
     */
    Optional<Portfolio> findByUuidAndUserId(UUID uuid, String userId);

    /**
     * Find portfolios by user ID and name (case insensitive search)
     */
    @Query("SELECT p FROM Portfolio p WHERE p.userId = :userId AND LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%')) ORDER BY p.createdAt DESC")
    List<Portfolio> findByUserIdAndNameContainingIgnoreCase(@Param("userId") String userId, @Param("name") String name);

    /**
     * Count portfolios by user ID
     */
    long countByUserId(String userId);

    /**
     * Check if a portfolio exists for a user
     */
    boolean existsByUuidAndUserId(UUID uuid, String userId);

    /**
     * Check if a portfolio name exists for a user (for duplicate prevention)
     */
    boolean existsByUserIdAndNameIgnoreCase(String userId, String name);

    /**
     * Check if a portfolio name exists for a user excluding specific UUID (for updates)
     */
    @Query("SELECT COUNT(p) > 0 FROM Portfolio p WHERE p.userId = :userId AND LOWER(p.name) = LOWER(:name) AND p.uuid != :excludeUuid")
    boolean existsByUserIdAndNameIgnoreCaseAndUuidNot(@Param("userId") String userId, @Param("name") String name, @Param("excludeUuid") UUID excludeUuid);

    /**
     * Delete a portfolio by UUID and user ID (for security)
     */
    void deleteByUuidAndUserId(UUID uuid, String userId);
}