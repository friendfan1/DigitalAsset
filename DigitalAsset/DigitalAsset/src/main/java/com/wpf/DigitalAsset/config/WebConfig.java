//package com.wpf.DigitalAsset.config;
//
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
//import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
//
//import java.nio.file.Path;
//
//@Configuration
//public class WebConfig implements WebMvcConfigurer {
//
//    @Autowired FileProperties fileProperties;
//
//    Path uploadPath = Path.of(fileProperties.getUpload());
//
//    @Override
//    public void addResourceHandlers(ResourceHandlerRegistry registry) {
//        registry.addResourceHandler("/uploads/**")  // 前端访问的 URL 路径
//                .addResourceLocations("file:" + uploadPath + "/");  // 实际文件存储路径
//    }
//}
