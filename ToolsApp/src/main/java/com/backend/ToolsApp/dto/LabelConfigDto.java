package com.backend.ToolsApp.dto;

public class LabelConfigDto {
    private int labelWidthMm;
    private int labelHeightMm;

    private int qrOffsetXPercent;
    private int qrOffsetYPercent;
    private int qrSizePercent;

    private boolean showName;
    private int nameOffsetXPercent;
    private int nameOffsetYPercent;
    private int nameFontSize;

    private boolean showId;
    private int idOffsetXPercent;
    private int idOffsetYPercent;
    private int idFontSize;

    private boolean showSerial;
    private int serialOffsetXPercent;
    private int serialOffsetYPercent;
    private int serialFontSize;

    private int gapMm; // 0 = foloseste calibrarea stocata in imprimanta

    public LabelConfigDto() {
        this.labelWidthMm = 50;
        this.labelHeightMm = 30;
        this.qrOffsetXPercent = 5;
        this.qrOffsetYPercent = 5;
        this.qrSizePercent = 55;
        this.showName = true;
        this.nameOffsetXPercent = 38;
        this.nameOffsetYPercent = 20;
        this.nameFontSize = 20;
        this.showId = false;
        this.idOffsetXPercent = 38;
        this.idOffsetYPercent = 55;
        this.idFontSize = 16;
        this.showSerial = false;
        this.serialOffsetXPercent = 38;
        this.serialOffsetYPercent = 70;
        this.serialFontSize = 16;
    }

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

    public boolean isShowSerial() { return showSerial; }
    public void setShowSerial(boolean v) { this.showSerial = v; }

    public int getSerialOffsetXPercent() { return serialOffsetXPercent; }
    public void setSerialOffsetXPercent(int v) { this.serialOffsetXPercent = v; }

    public int getSerialOffsetYPercent() { return serialOffsetYPercent; }
    public void setSerialOffsetYPercent(int v) { this.serialOffsetYPercent = v; }

    public int getSerialFontSize() { return serialFontSize; }
    public void setSerialFontSize(int v) { this.serialFontSize = v; }

    public int getGapMm() { return gapMm; }
    public void setGapMm(int v) { this.gapMm = v; }
}
