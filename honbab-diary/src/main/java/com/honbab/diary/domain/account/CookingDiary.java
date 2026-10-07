package com.honbab.diary.domain.account;

import jakarta.persistence.*;
import lombok.*;
import static com.honbab.diary.domain.account.AccountContentDtos.*;

@Entity
@Table(name="cooking_diary", uniqueConstraints=@UniqueConstraint(columnNames={"user_id", "client_id"}))
@Getter
@NoArgsConstructor(access=AccessLevel.PROTECTED)
public class CookingDiary {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private Long userId;
    @Column(nullable=false, length=150) private String clientId;
    @Column(nullable=false) private Long recipeId;
    private Long shortsId;
    @Column(nullable=false, length=300) private String recipeTitle;
    @Column(nullable=false, columnDefinition="text") private String photoUrl;
    @Column(nullable=false) private int rating;
    @Column(nullable=false, length=1000) private String comment;
    @Column(columnDefinition="text") private String privateDiary;
    @Column(nullable=false) private long createdAt;
    @Column(nullable=false) private boolean liked;
    @Column(nullable=false) private boolean deleted;
    @Column(nullable=false) private int streakDay;

    public CookingDiary(Long userId, DiaryInput input, boolean imported, int streakDay) {
        this.userId=userId; this.clientId=input.id(); this.recipeId=input.recipeId(); this.shortsId=input.shortsId();
        this.recipeTitle=input.recipeTitle(); this.photoUrl=input.photoUrl(); this.rating=input.rating();
        this.comment=input.comment().trim(); this.privateDiary=input.privateDiary(); this.liked=true;
        this.createdAt=imported ? Math.min(input.createdAt(), System.currentTimeMillis()) : System.currentTimeMillis();
        this.streakDay=streakDay;
    }
    public void like(boolean liked) { this.liked=liked; }
    // Keep only an idempotency tombstone so a repeated legacy import cannot resurrect it.
    public void delete() {
        deleted=true; photoUrl=""; comment=""; privateDiary=null; recipeTitle="";
    }
    public void syncRecipe(long shortsId, long recipeId) {
        if ((this.shortsId!=null && this.shortsId==shortsId) || (this.shortsId==null && this.recipeId==shortsId)) {
            this.shortsId=shortsId; this.recipeId=recipeId;
        }
    }
    public DiaryView view(String nickname) {
        return new DiaryView(clientId, recipeId, shortsId, recipeTitle, photoUrl, rating, comment,
                privateDiary, nickname, nickname, 1, "", createdAt, liked ? 1 : 0, liked, liked, true, streakDay);
    }
}
