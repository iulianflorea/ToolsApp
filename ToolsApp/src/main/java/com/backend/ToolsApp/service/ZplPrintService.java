package com.backend.ToolsApp.service;

import com.backend.ToolsApp.dto.PrintRequestDto;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.EnumMap;
import java.util.Map;

@Service
public class ZplPrintService {

    private static final Logger log = LoggerFactory.getLogger(ZplPrintService.class);
    private static final double DOTS_PER_MM = 203.0 / 25.4;

    // TSC TE210 built-in font base heights in dots
    private static final int[] FONT_HEIGHTS = {12, 20, 28, 40, 48};

    public void print(PrintRequestDto request) throws IOException {
        byte[] data = buildTsplBytes(request);
        log.info("Sending {} bytes to {}:{}", data.length, request.getPrinterIp(), request.getPrinterPort());
        try (Socket socket = new Socket(request.getPrinterIp(), request.getPrinterPort());
             OutputStream out = socket.getOutputStream()) {
            out.write(data);
            out.flush();
        }
    }

    private int mmToDots(double mm) {
        return (int) Math.round(mm * DOTS_PER_MM);
    }

    private int pct(int total, double percent) {
        return (int) Math.round(total * percent / 100.0);
    }

    private String sanitize(String s) {
        if (s == null) return "";
        return s.replace("\"", "'").replace("\\", "");
    }

    private int[] fontParams(int requestedDots) {
        int bestFont = 0, bestMult = 1;
        int bestDiff = Integer.MAX_VALUE;
        for (int fi = 0; fi < FONT_HEIGHTS.length; fi++) {
            for (int m = 1; m <= 4; m++) {
                int diff = Math.abs(FONT_HEIGHTS[fi] * m - requestedDots);
                if (diff < bestDiff) {
                    bestDiff = diff;
                    bestFont = fi;
                    bestMult = m;
                }
            }
        }
        return new int[]{bestFont, bestMult};
    }

    /**
     * Generează QR code cu ZXing și returnează BitMatrix.
     * Același algoritm ca biblioteca JS qrcode din frontend (ECC M).
     */
    private BitMatrix generateQrMatrix(String data, int sizeDots) throws WriterException {
        Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
        hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M);
        hints.put(EncodeHintType.MARGIN, 1); // 1 modul quiet zone
        return new QRCodeWriter().encode(data, BarcodeFormat.QR_CODE, sizeDots, sizeDots, hints);
    }

    /**
     * Convertește BitMatrix în bytes pentru comanda TSPL BITMAP.
     * MSB primul: bit=1 = modul întunecat (negru).
     */
    private byte[] matrixToBytes(BitMatrix matrix) {
        int width = matrix.getWidth();
        int height = matrix.getHeight();
        int widthBytes = (width + 7) / 8;
        byte[] data = new byte[widthBytes * height];
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                if (matrix.get(x, y)) {
                    data[y * widthBytes + x / 8] |= (byte) (0x80 >> (x % 8));
                }
            }
        }
        return data;
    }

    private void writeAscii(ByteArrayOutputStream buf, String s) {
        buf.writeBytes(s.getBytes(StandardCharsets.US_ASCII));
    }

    private byte[] buildTsplBytes(PrintRequestDto req) {
        int W = mmToDots(req.getLabelWidthMm());
        int H = mmToDots(req.getLabelHeightMm());

        int qrSizeDots = pct(W, req.getQrSizePercent());
        int qrX        = pct(W, req.getQrOffsetXPercent());
        int qrY        = pct(H, req.getQrOffsetYPercent());

        ByteArrayOutputStream buf = new ByteArrayOutputStream();

        // ── Header ────────────────────────────────────────────────────────────
        writeAscii(buf, "SIZE " + req.getLabelWidthMm() + " mm," + req.getLabelHeightMm() + " mm\r\n");
        if (req.getGapMm() > 0) {
            writeAscii(buf, "GAP " + req.getGapMm() + " mm,0\r\n");
        }
        writeAscii(buf, "DIRECTION 0,0\r\n");
        writeAscii(buf, "CLS\r\n");

        // ── Cod QR ca bitmap (ZXing — identic cu frontend) ────────────────────
        try {
            BitMatrix matrix = generateQrMatrix(sanitize(req.getQrCode()), qrSizeDots);
            int qrW      = matrix.getWidth();
            int qrH      = matrix.getHeight();
            int wBytes   = (qrW + 7) / 8;
            byte[] qrBmp = matrixToBytes(matrix);

            log.info("QR bitmap: {}×{} dots ({} bytes), position ({},{})",
                     qrW, qrH, qrBmp.length, qrX, qrY);

            writeAscii(buf, "BITMAP " + qrX + "," + qrY + "," + wBytes + "," + qrH + ",0,");
            buf.writeBytes(qrBmp);
            writeAscii(buf, "\r\n");
        } catch (WriterException e) {
            log.error("Nu s-a putut genera QR code: {}", e.getMessage());
        }

        // ── Nume unealtă ───────────────────────────────────────────────────────
        if (req.isShowName() && req.getLabelText() != null && !req.getLabelText().isBlank()) {
            int nx     = pct(W, req.getNameOffsetXPercent());
            int ny     = pct(H, req.getNameOffsetYPercent());
            int availW = W - nx;
            int availH = H - ny;
            int[] fp   = fontParams(req.getNameFontSize());
            writeAscii(buf, "BLOCK " + nx + "," + ny + "," + availW + "," + availH
                + ",\"" + fp[0] + "\",0," + fp[1] + "," + fp[1]
                + ",\"" + sanitize(req.getLabelText()) + "\"\r\n");
        }

        // ── ID cod QR ──────────────────────────────────────────────────────────
        if (req.isShowId()) {
            int idx  = pct(W, req.getIdOffsetXPercent());
            int idy  = pct(H, req.getIdOffsetYPercent());
            int[] fp = fontParams(req.getIdFontSize());
            writeAscii(buf, "TEXT " + idx + "," + idy
                + ",\"" + fp[0] + "\",0," + fp[1] + "," + fp[1]
                + ",\"ID:" + sanitize(req.getQrCode()) + "\"\r\n");
        }

        // ── Număr de serie ─────────────────────────────────────────────────────
        if (req.isShowSerial() && req.getSerialText() != null && !req.getSerialText().isBlank()) {
            int snx  = pct(W, req.getSerialOffsetXPercent());
            int sny  = pct(H, req.getSerialOffsetYPercent());
            int[] fp = fontParams(req.getSerialFontSize());
            writeAscii(buf, "TEXT " + snx + "," + sny
                + ",\"" + fp[0] + "\",0," + fp[1] + "," + fp[1]
                + ",\"SN:" + sanitize(req.getSerialText()) + "\"\r\n");
        }

        writeAscii(buf, "PRINT 1,1\r\n");
        return buf.toByteArray();
    }
}
