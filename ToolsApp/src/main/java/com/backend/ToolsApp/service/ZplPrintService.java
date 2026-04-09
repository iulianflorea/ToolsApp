package com.backend.ToolsApp.service;

import com.backend.ToolsApp.dto.PrintRequestDto;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.OutputStream;
import java.net.Socket;
import java.nio.charset.StandardCharsets;

@Service
public class ZplPrintService {

    private static final int DOTS_PER_MM = 8; // 203 DPI ≈ 8 dots/mm

    public void print(PrintRequestDto request) throws IOException {
        String zpl = buildZpl(request);
        try (Socket socket = new Socket(request.getPrinterIp(), request.getPrinterPort());
             OutputStream out = socket.getOutputStream()) {
            out.write(zpl.getBytes(StandardCharsets.US_ASCII));
            out.flush();
        }
    }

    private String buildZpl(PrintRequestDto req) {
        int labelWidthDots  = req.getLabelWidthMm()  * DOTS_PER_MM;
        int labelHeightDots = req.getLabelHeightMm() * DOTS_PER_MM;

        int qrSizeDots      = (labelWidthDots * req.getQrSizePercent())    / 100;
        int qrMagnification = Math.min(10, Math.max(2, qrSizeDots / 10));
        int qrX             = (labelWidthDots  * req.getQrOffsetXPercent()) / 100;
        int qrY             = (labelHeightDots * req.getQrOffsetYPercent()) / 100;

        StringBuilder zpl = new StringBuilder();
        zpl.append("^XA");
        zpl.append("^PW").append(labelWidthDots);
        zpl.append("^LL").append(labelHeightDots);

        // ── QR Code ────────────────────────────────────────────────────────────
        zpl.append("^FO").append(qrX).append(",").append(qrY);
        zpl.append("^BQN,2,").append(qrMagnification);
        zpl.append("^FDQA,").append(req.getQrCode()).append("^FS");

        // ── Nume unealtă (cu word wrap via ^FB) ───────────────────────────────
        if (req.isShowName() && req.getLabelText() != null && !req.getLabelText().isBlank()) {
            int nameX        = (labelWidthDots  * req.getNameOffsetXPercent()) / 100;
            int nameY        = (labelHeightDots * req.getNameOffsetYPercent()) / 100;
            int nameSize     = Math.max(8, req.getNameFontSize());
            int availWidth   = labelWidthDots - nameX;
            int maxLines     = Math.max(1, (labelHeightDots - nameY) / nameSize);
            zpl.append("^FO").append(nameX).append(",").append(nameY);
            zpl.append("^A0N,").append(nameSize).append(",").append(nameSize);
            // ^FB width, maxLines, lineSpacing, justification, hangingIndent
            zpl.append("^FB").append(availWidth).append(",").append(maxLines).append(",0,L,0");
            zpl.append("^FD").append(req.getLabelText()).append("^FS");
        }

        // ── ID cod QR ──────────────────────────────────────────────────────────
        if (req.isShowId()) {
            int idX    = (labelWidthDots  * req.getIdOffsetXPercent()) / 100;
            int idY    = (labelHeightDots * req.getIdOffsetYPercent()) / 100;
            int idSize = Math.max(6, req.getIdFontSize());
            zpl.append("^FO").append(idX).append(",").append(idY);
            zpl.append("^A0N,").append(idSize).append(",").append(idSize);
            zpl.append("^FDID:").append(req.getQrCode()).append("^FS");
        }

        // ── Număr de serie ─────────────────────────────────────────────────────
        if (req.isShowSerial() && req.getSerialText() != null && !req.getSerialText().isBlank()) {
            int snX    = (labelWidthDots  * req.getSerialOffsetXPercent()) / 100;
            int snY    = (labelHeightDots * req.getSerialOffsetYPercent()) / 100;
            int snSize = Math.max(6, req.getSerialFontSize());
            zpl.append("^FO").append(snX).append(",").append(snY);
            zpl.append("^A0N,").append(snSize).append(",").append(snSize);
            zpl.append("^FDSN:").append(req.getSerialText()).append("^FS");
        }

        zpl.append("^XZ");
        return zpl.toString();
    }
}
