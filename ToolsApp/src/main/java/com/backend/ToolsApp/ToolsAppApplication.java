package com.backend.ToolsApp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ToolsAppApplication {

    public static void main(String[] args) {
        SpringApplication.run(ToolsAppApplication.class, args);
    }
}
