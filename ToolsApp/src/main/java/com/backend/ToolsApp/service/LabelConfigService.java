package com.backend.ToolsApp.service;

import com.backend.ToolsApp.dto.LabelConfigDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;

@Service
public class LabelConfigService {

    private static final String CONFIG_FILE = "label-config.json";
    private final ObjectMapper objectMapper = new ObjectMapper();
    private LabelConfigDto currentConfig;

    @PostConstruct
    public void init() {
        File file = new File(CONFIG_FILE);
        if (file.exists()) {
            try {
                currentConfig = objectMapper.readValue(file, LabelConfigDto.class);
            } catch (IOException e) {
                currentConfig = new LabelConfigDto();
            }
        } else {
            currentConfig = new LabelConfigDto();
        }
    }

    public LabelConfigDto getConfig() {
        return currentConfig;
    }

    public LabelConfigDto saveConfig(LabelConfigDto config) {
        this.currentConfig = config;
        try {
            objectMapper.writeValue(new File(CONFIG_FILE), config);
        } catch (IOException e) {
            throw new RuntimeException("Nu s-a putut salva configurația etichetei", e);
        }
        return currentConfig;
    }
}
