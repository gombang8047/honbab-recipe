package com.honbab.diary.global.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
        String jwtSchemeName = "Bearer Authentication";

        SecurityRequirement securityRequirement = new SecurityRequirement().addList(jwtSchemeName);

        SecurityScheme securityScheme = new SecurityScheme()
                .name(jwtSchemeName)
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .description("JWT 토큰을 입력하세요 (Bearer 접두사 불필요)");

        return new OpenAPI()
                .info(new Info()
                        .title("🍳 혼밥일기 API")
                        .description("자취생을 위한 AI 레시피 플랫폼 API 문서")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("혼밥일기 팀")
                                .email("team@honbab-diary.com")))
                .addSecurityItem(securityRequirement)
                .components(new Components()
                        .addSecuritySchemes(jwtSchemeName, securityScheme));
    }
}
