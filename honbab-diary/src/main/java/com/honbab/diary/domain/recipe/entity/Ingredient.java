package com.honbab.diary.domain.recipe.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ingredient")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Ingredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 50)
    private String category;

    @Column(name = "storage_type", length = 30)
    @Enumerated(EnumType.STRING)
    private StorageType storageType;

    @Builder
    public Ingredient(String name, String category, StorageType storageType) {
        this.name = name;
        this.category = category;
        this.storageType = storageType;
    }

    public enum StorageType {
        ROOM_TEMP, REFRIGERATED, FROZEN
    }
}
