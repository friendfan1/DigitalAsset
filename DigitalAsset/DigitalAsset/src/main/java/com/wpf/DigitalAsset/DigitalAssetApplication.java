package com.wpf.DigitalAsset;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling // 启用计划任务
public class DigitalAssetApplication {

	public static void main(String[] args) {
		SpringApplication.run(DigitalAssetApplication.class, args);
	}

}
