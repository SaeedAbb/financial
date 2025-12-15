package com.basis.api.features.saving;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "savings", schema = "basis")
public class Saving {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private UUID uuid = UUID.randomUUID();

    @Column(name = "user_id", nullable = false)
    @NotBlank(message = "User ID cannot be blank")
    private String userId;

    @Column(nullable = false, precision = 15, scale = 2)
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;

    @Column(name = "saving_type", nullable = false)
    @Enumerated(EnumType.STRING)
    @NotNull(message = "Saving type is required")
    private SavingType savingType;

    @Column(name = "saving_date", nullable = false)
    @NotNull(message = "Saving date is required")
    private LocalDate savingDate;

    @Column(columnDefinition = "TEXT")
    @Size(max = 1000, message = "Comments cannot exceed 1000 characters")
    private String comments;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private ZonedDateTime updatedAt;

    @Version
    private Long version;

    // Default constructor
    public Saving() {}

    // Constructor for creating new savings
    public Saving(String userId, BigDecimal amount, SavingType savingType, LocalDate savingDate, String comments) {
        this.userId = userId;
        this.amount = amount;
        this.savingType = savingType;
        this.savingDate = savingDate;
        this.comments = comments;
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UUID getUuid() {
        return uuid;
    }

    public void setUuid(UUID uuid) {
        this.uuid = uuid;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public SavingType getSavingType() {
        return savingType;
    }

    public void setSavingType(SavingType savingType) {
        this.savingType = savingType;
    }

    public LocalDate getSavingDate() {
        return savingDate;
    }

    public void setSavingDate(LocalDate savingDate) {
        this.savingDate = savingDate;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }

    public ZonedDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(ZonedDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public ZonedDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(ZonedDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Saving saving = (Saving) o;
        return uuid != null && uuid.equals(saving.uuid);
    }

    @Override
    public int hashCode() {
        return uuid != null ? uuid.hashCode() : 0;
    }

    @Override
    public String toString() {
        return "Saving{" +
                "id=" + id +
                ", uuid=" + uuid +
                ", userId='" + userId + '\'' +
                ", amount=" + amount +
                ", savingType=" + savingType +
                ", savingDate=" + savingDate +
                ", comments='" + comments + '\'' +
                '}';
    }
}