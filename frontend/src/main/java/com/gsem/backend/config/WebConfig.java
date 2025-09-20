package com.gsem.backend.config;


import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // API 경로
//               .allowedOrigins("http://localhost:3000") // React 개발 서버 주소
                .allowedOrigins("http://sems-project.s3-website-us-east-1.amazonaws.com")
                .allowedMethods("*")
                .allowedHeaders("*");
    }
}
