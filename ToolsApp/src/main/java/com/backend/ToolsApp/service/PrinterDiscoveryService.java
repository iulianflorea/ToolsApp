package com.backend.ToolsApp.service;

import com.backend.ToolsApp.dto.PrinterInfoDto;
import org.springframework.stereotype.Service;

import javax.jmdns.JmDNS;
import javax.jmdns.ServiceInfo;
import java.io.IOException;
import java.net.*;
import java.util.*;
import java.util.concurrent.*;

@Service
public class PrinterDiscoveryService {

    private static final int ZPL_PORT = 9100;
    private static final int SCAN_TIMEOUT_MS = 500;
    private static final int CACHE_CHECK_TIMEOUT_MS = 800;

    private List<PrinterInfoDto> cachedPrinters = new ArrayList<>();

    public List<PrinterInfoDto> discoverAll() {
        if (!cachedPrinters.isEmpty()) {
            List<PrinterInfoDto> stillAlive = cachedPrinters.stream()
                .filter(this::isReachable)
                .toList();

            if (!stillAlive.isEmpty()) {
                return stillAlive.stream()
                    .map(p -> new PrinterInfoDto(p.getName(), p.getIp(), p.getPort(), "cache"))
                    .toList();
            }
            cachedPrinters.clear();
        }

        List<PrinterInfoDto> found = discoverViaMdns();
        if (found.isEmpty()) {
            found = discoverViaScan();
        }

        cachedPrinters = new ArrayList<>(found);
        return found;
    }

    public void clearCache() {
        cachedPrinters.clear();
    }

    private boolean isReachable(PrinterInfoDto printer) {
        try (Socket socket = new Socket()) {
            socket.connect(
                new InetSocketAddress(printer.getIp(), printer.getPort()),
                CACHE_CHECK_TIMEOUT_MS
            );
            return true;
        } catch (IOException e) {
            return false;
        }
    }

    private List<PrinterInfoDto> discoverViaMdns() {
        List<PrinterInfoDto> found = new ArrayList<>();
        try {
            JmDNS jmdns = JmDNS.create(InetAddress.getLocalHost());
            String[] types = {"_pdl-datastream._tcp.local.", "_ipp._tcp.local.", "_printer._tcp.local."};
            for (String type : types) {
                ServiceInfo[] services = jmdns.list(type, 3000);
                for (ServiceInfo info : services) {
                    String[] addresses = info.getHostAddresses();
                    if (addresses.length > 0) {
                        found.add(new PrinterInfoDto(info.getName(), addresses[0], info.getPort(), "mdns"));
                    }
                }
            }
            jmdns.close();
        } catch (IOException e) {
            // mDNS failed, fallback to scan
        }
        return found;
    }

    private List<PrinterInfoDto> discoverViaScan() {
        List<PrinterInfoDto> found = new CopyOnWriteArrayList<>();
        try {
            String localIp = InetAddress.getLocalHost().getHostAddress();
            String subnet = localIp.substring(0, localIp.lastIndexOf('.') + 1);

            ExecutorService executor = Executors.newFixedThreadPool(50);
            List<CompletableFuture<Void>> futures = new ArrayList<>();

            for (int i = 1; i <= 254; i++) {
                final String ip = subnet + i;
                futures.add(CompletableFuture.runAsync(() -> {
                    try (Socket socket = new Socket()) {
                        socket.connect(new InetSocketAddress(ip, ZPL_PORT), SCAN_TIMEOUT_MS);
                        String hostname;
                        try {
                            hostname = InetAddress.getByName(ip).getHostName();
                        } catch (Exception e) {
                            hostname = "Printer @ " + ip;
                        }
                        found.add(new PrinterInfoDto(hostname, ip, ZPL_PORT, "scan"));
                    } catch (IOException ignored) {}
                }, executor));
            }

            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).get(15, TimeUnit.SECONDS);
            executor.shutdown();
        } catch (Exception e) {
            // scan failed
        }
        return found;
    }
}
