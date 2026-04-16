package com.backend.ToolsApp.controller;

import com.backend.ToolsApp.dto.PrintRequestDto;
import com.backend.ToolsApp.dto.PrinterInfoDto;
import com.backend.ToolsApp.service.PrinterDiscoveryService;
import com.backend.ToolsApp.service.ZplPrintService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/printers")
public class PrinterController {

    @Autowired
    private PrinterDiscoveryService discoveryService;

    @Autowired
    private ZplPrintService printService;

    @GetMapping
    public List<PrinterInfoDto> getPrinters() {
        return discoveryService.discoverAll();
    }

    @PostMapping("/clear-cache")
    public ResponseEntity<String> clearCache() {
        discoveryService.clearCache();
        return ResponseEntity.ok("Cache șters. Următorul apel va face discovery complet.");
    }

    @PostMapping("/print")
    public ResponseEntity<String> print(@RequestBody PrintRequestDto request) {
        try {
            printService.print(request);
            return ResponseEntity.ok("Printat cu succes");
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Eroare la printare: " + e.getMessage());
        }
    }
}
