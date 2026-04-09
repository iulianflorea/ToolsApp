package com.backend.ToolsApp.dto;

public class PrinterInfoDto {
    private String name;
    private String ip;
    private int port;
    private String discoveryMethod;

    public PrinterInfoDto() {}

    public PrinterInfoDto(String name, String ip, int port, String discoveryMethod) {
        this.name = name;
        this.ip = ip;
        this.port = port;
        this.discoveryMethod = discoveryMethod;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getIp() { return ip; }
    public void setIp(String ip) { this.ip = ip; }

    public int getPort() { return port; }
    public void setPort(int port) { this.port = port; }

    public String getDiscoveryMethod() { return discoveryMethod; }
    public void setDiscoveryMethod(String discoveryMethod) { this.discoveryMethod = discoveryMethod; }
}
