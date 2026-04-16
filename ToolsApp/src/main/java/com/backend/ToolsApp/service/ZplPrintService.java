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

import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
public class ZplPrintService {

    private static final Logger log = LoggerFactory.getLogger(ZplPrintService.class);

    private static final double DOTS_PER_MM  = 203.0 / 25.4;
    private static final double CANVAS_SCALE = 6.0; // px/mm — identic cu SCALE din Angular

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

    /**
     * Converteste marimea fontului din preview in dots printer.
     * Formula identica cu Angular: fpx = max(minPx, round(fontSize * factor))
     * dots = fpx * DOTS_PER_MM / CANVAS_SCALE
     */
    private int previewFontToDots(int fontSize, double factor, int minPx) {
        double fpx = Math.max(minPx, Math.round(fontSize * factor));
        return Math.max(8, (int) Math.round(fpx * DOTS_PER_MM / CANVAS_SCALE));
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

        // ── Cod QR ca bitmap ZXing ────────────────────────────────────────────
        try {
            BitMatrix matrix = generateQrMatrix(sanitize(req.getQrCode()), qrSizeDots);
            int qrW      = matrix.getWidth();
            int qrH      = matrix.getHeight();
            int wBytes   = (qrW + 7) / 8;
            byte[] qrBmp = matrixToBytes(matrix);
            log.info("QR bitmap: {}x{} dots, pozitie ({},{})", qrW, qrH, qrX, qrY);
            writeAscii(buf, "BITMAP " + qrX + "," + qrY + "," + wBytes + "," + qrH + ",0,");
            buf.writeBytes(qrBmp);
            writeAscii(buf, "\r\n");
        } catch (WriterException e) {
            log.error("Nu s-a putut genera QR: {}", e.getMessage());
        }

        // ── Nume unealtă — bitmap Java, marime exacta din formula preview ─────
        // Preview: fpx = max(6, round(nameFontSize * 0.45)), bold sans-serif
        if (req.isShowName() && req.getLabelText() != null && !req.getLabelText().isBlank()) {
            int nx       = pct(W, req.getNameOffsetXPercent());
            int ny       = pct(H, req.getNameOffsetYPercent());
            int fontDots = previewFontToDots(req.getNameFontSize(), 0.45, 6);
            writeTextBitmap(buf, nx, ny, W - nx, H, fontDots, Font.BOLD, "SansSerif", req.getLabelText());
        }

        // ── ID cod QR — bitmap Java, marime exacta din formula preview ────────
        // Preview: fpx = max(5, round(idFontSize * 0.45)), monospaced
        if (req.isShowId() && req.getQrCode() != null && !req.getQrCode().isBlank()) {
            int ix       = pct(W, req.getIdOffsetXPercent());
            int iy       = pct(H, req.getIdOffsetYPercent());
            int fontDots = previewFontToDots(req.getIdFontSize(), 0.45, 5);
            writeTextBitmap(buf, ix, iy, W - ix, H, fontDots, Font.PLAIN, "Monospaced", "ID:" + sanitize(req.getQrCode()));
        }

        // ── Număr de serie — bitmap Java, marime exacta din formula preview ───
        // Preview: fpx = max(5, round(serialFontSize * 0.45)), monospaced
        if (req.isShowSerial() && req.getSerialText() != null && !req.getSerialText().isBlank()) {
            int sx       = pct(W, req.getSerialOffsetXPercent());
            int sy       = pct(H, req.getSerialOffsetYPercent());
            int fontDots = previewFontToDots(req.getSerialFontSize(), 0.45, 5);
            writeTextBitmap(buf, sx, sy, W - sx, H, fontDots, Font.PLAIN, "Monospaced", "SN:" + sanitize(req.getSerialText()));
        }

        writeAscii(buf, "PRINT 1,1\r\n");
        return buf.toByteArray();
    }

    /**
     * Renderizeaza text ca bitmap Java si il trimite ca comenzi TSPL BITMAP.
     * Garanteaza marimea exacta fata de preview. Suporta word-wrap.
     */
    private void writeTextBitmap(ByteArrayOutputStream buf,
                                  int x, int y, int availW, int labelH,
                                  int fontDots, int fontStyle, String fontName, String text) {
        if (text == null || text.isBlank() || availW <= 0 || fontDots <= 0) return;

        Font font = new Font(fontName, fontStyle, fontDots);

        BufferedImage tmpImg = new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB);
        Graphics2D tmpG = tmpImg.createGraphics();
        configureGraphics(tmpG);
        tmpG.setFont(font);
        FontMetrics fm = tmpG.getFontMetrics();
        tmpG.dispose();

        List<String> lines = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        for (String word : text.split(" ")) {
            String candidate = current.length() > 0 ? current + " " + word : word;
            if (current.length() > 0 && fm.stringWidth(candidate) > availW) {
                lines.add(current.toString());
                current = new StringBuilder(word);
            } else {
                current = new StringBuilder(candidate);
            }
        }
        if (current.length() > 0) lines.add(current.toString());

        int lineH   = fm.getAscent() + fm.getDescent();
        int lineGap = lineH + Math.max(2, lineH / 8);

        for (int i = 0; i < lines.size(); i++) {
            int lineY = y + i * lineGap;
            if (lineY + lineH > labelH) break;

            String lineText = lines.get(i);
            int lineW = fm.stringWidth(lineText);
            if (lineW <= 0) continue;

            BufferedImage img = new BufferedImage(lineW, lineH, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = img.createGraphics();
            configureGraphics(g);
            g.setFont(font);
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, lineW, lineH);
            g.setColor(Color.BLACK);
            g.drawString(lineText, 0, fm.getAscent());
            g.dispose();

            int widthBytes = (lineW + 7) / 8;
            byte[] bmpData = imageToBitmapBytes(img, lineW, lineH, widthBytes);

            writeAscii(buf, "BITMAP " + x + "," + lineY + "," + widthBytes + "," + lineH + ",0,");
            buf.writeBytes(bmpData);
            writeAscii(buf, "\r\n");
        }
    }

    private static void configureGraphics(Graphics2D g) {
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_OFF);
        g.setRenderingHint(RenderingHints.KEY_FRACTIONALMETRICS, RenderingHints.VALUE_FRACTIONALMETRICS_OFF);
        g.setRenderingHint(RenderingHints.KEY_RENDERING,         RenderingHints.VALUE_RENDER_QUALITY);
    }

    private static byte[] imageToBitmapBytes(BufferedImage img, int width, int height, int widthBytes) {
        byte[] data = new byte[widthBytes * height];
        Arrays.fill(data, (byte) 0xFF); // TSPL: bit=1=alb, bit=0=negru
        for (int row = 0; row < height; row++) {
            for (int col = 0; col < width; col++) {
                int rgb  = img.getRGB(col, row);
                int luma = ((rgb >> 16 & 0xFF) + (rgb >> 8 & 0xFF) + (rgb & 0xFF)) / 3;
                if (luma < 128) {
                    data[row * widthBytes + col / 8] &= (byte) ~(0x80 >> (col % 8));
                }
            }
        }
        return data;
    }

    private BitMatrix generateQrMatrix(String data, int sizeDots) throws WriterException {
        Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
        hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M);
        hints.put(EncodeHintType.MARGIN, 1);
        return new QRCodeWriter().encode(data, BarcodeFormat.QR_CODE, sizeDots, sizeDots, hints);
    }

    private static byte[] matrixToBytes(BitMatrix matrix) {
        int width      = matrix.getWidth();
        int height     = matrix.getHeight();
        int widthBytes = (width + 7) / 8;
        byte[] data    = new byte[widthBytes * height];
        Arrays.fill(data, (byte) 0xFF); // TSPL: bit=1=alb, bit=0=negru
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                if (matrix.get(x, y)) {
                    data[y * widthBytes + x / 8] &= (byte) ~(0x80 >> (x % 8));
                }
            }
        }
        return data;
    }

    private void writeAscii(ByteArrayOutputStream buf, String s) {
        buf.writeBytes(s.getBytes(StandardCharsets.US_ASCII));
    }
}
