package com.backend.ToolsApp.dto;

public class PrintRequestDto {
    private String printerIp;
    private int printerPort;
    private String qrCode;

    private int labelWidthMm;
    private int labelHeightMm;

    private int qrOffsetXPercent;
    private int qrOffsetYPercent;
    private int qrSizePercent;

    private String labelText;
    private boolean showName;
    private int nameOffsetXPercent;
    private int nameOffsetYPercent;
    private int nameFontSize;

    private boolean showId;
    private int idOffsetXPercent;
    private int idOffsetYPercent;
    private int idFontSize;

    private String serialText;
    private boolean showSerial;
    private int serialOffsetXPercent;
    private int serialOffsetYPercent;
    private int serialFontSize;

    public PrintRequestDto() {}

    public String getPrinterIp() { return printerIp; }
    public void setPrinterIp(String v) { this.printerIp = v; }

    public int getPrinterPort() { return printerPort; }
    public void setPrinterPort(int v) { this.printerPort = v; }

    public String getQrCode() { return qrCode; }
    public void setQrCode(String v) { this.qrCode = v; }

    public int getLabelWidthMm() { return labelWidthMm; }
    public void setLabelWidthMm(int v) { this.labelWidthMm = v; }

    public int getLabelHeightMm() { return labelHeightMm; }
    public void setLabelHeightMm(int v) { this.labelHeightMm = v; }

    public int getQrOffsetXPercent() { return qrOffsetXPercent; }
    public void setQrOffsetXPercent(int v) { this.qrOffsetXPercent = v; }

    public int getQrOffsetYPercent() { return qrOffsetYPercent; }
    public void setQrOffsetYPercent(int v) { this.qrOffsetYPercent = v; }

    public int getQrSizePercent() { return qrSizePercent; }
    public void setQrSizePercent(int v) { this.qrSizePercent = v; }

    public String getLabelText() { return labelText; }
    public void setLabelText(String v) { this.labelText = v; }

    public boolean isShowName() { return showName; }
    public void setShowName(boolean v) { this.showName = v; }

    public int getNameOffsetXPercent() { return nameOffsetXPercent; }
    public void setNameOffsetXPercent(int v) { this.nameOffsetXPercent = v; }

    public int getNameOffsetYPercent() { return nameOffsetYPercent; }
    public void setNameOffsetYPercent(int v) { this.nameOffsetYPercent = v; }

    public int getNameFontSize() { return nameFontSize; }
    public void setNameFontSize(int v) { this.nameFontSize = v; }

    public boolean isShowId() { return showId; }
    public void setShowId(boolean v) { this.showId = v; }

    public int getIdOffsetXPercent() { return idOffsetXPercent; }
    public void setIdOffsetXPercent(int v) { this.idOffsetXPercent = v; }

    public int getIdOffsetYPercent() { return idOffsetYPercent; }
    public void setIdOffsetYPercent(int v) { this.idOffsetYPercent = v; }

    public int getIdFontSize() { return idFontSize; }
    public void setIdFontSize(int v) { this.idFontSize = v; }

    public String getSerialText() { return serialText; }
    public void setSerialText(String v) { this.serialText = v; }

    public boolean isShowSerial() { return showSerial; }
    public void setShowSerial(boolean v) { this.showSerial = v; }

    public int getSerialOffsetXPercent() { return serialOffsetXPercent; }
    public void setSerialOffsetXPercent(int v) { this.serialOffsetXPercent = v; }

    public int getSerialOffsetYPercent() { return serialOffsetYPercent; }
    public void setSerialOffsetYPercent(int v) { this.serialOffsetYPercent = v; }

    public int getSerialFontSize() { return serialFontSize; }
    public void setSerialFontSize(int v) { this.serialFontSize = v; }
}
