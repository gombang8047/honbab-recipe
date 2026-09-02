package com.honbab.diary.domain.recipe.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "recipe_ingredient")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RecipeIngredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    @Column(length = 50)
    private String amount;

    @Column(length = 20)
    private String unit;

    @Column(name = "is_essential", nullable = false)
    private Boolean isEssential = true;

    @Builder
    public RecipeIngredient(Recipe recipe, Ingredient ingredient,
                            String amount, String unit, Boolean isEssential) {
        this.recipe = recipe;
        this.ingredient = ingredient;
        this.amount = amount;
        this.unit = unit;
        this.isEssential = isEssential != null ? isEssential : true;
    }
}
