package com.wpf.DigitalAsset;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EnableJpaAuditing
@EntityScan("com.wpf.DigitalAsset.dao")
@EnableJpaRepositories("com.wpf.DigitalAsset.dao")
@ComponentScan(basePackages = {
    "com.wpf.DigitalAsset.controller",
    "com.wpf.DigitalAsset.service",
    "com.wpf.DigitalAsset.config",
    "com.wpf.DigitalAsset.util"
})
public class DigitalAssetApplication {

	public static void main(String[] args) {
		SpringApplication.run(DigitalAssetApplication.class, args);
	}

}
