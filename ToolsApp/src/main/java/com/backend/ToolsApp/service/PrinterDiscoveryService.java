package com.backend.ToolsApp.service;

import com.backend.ToolsApp.dto.PrinterInfoDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.*;
import java.util.*;
import java.util.concurrent.*;

@Service
public class PrinterDiscoveryService {

    private static final Logger log = LoggerFactory.getLogger(PrinterDiscoveryService.class);

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
                log.info("Returning {} printer(s) from cache", stillAlive.size());
                return stillAlive.stream()
                    .map(p -> new PrinterInfoDto(p.getName(), p.getIp(), p.getPort(), "cache"))
                    .toList();
            }
            cachedPrinters.clear();
        }

        List<PrinterInfoDto> found = discoverViaScan();
        cachedPrinters = new ArrayList<>(found);
        log.info("Discovery complete — found {} printer(s)", found.size());
        return found;
    }

    public void clearCache() {
        cachedPrinters.clear();
        log.info("Printer cache cleared");
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

    private List<PrinterInfoDto> discoverViaScan() {
        List<PrinterInfoDto> found = Collections.synchronizedList(new ArrayList<>());
        ExecutorService executor = Executors.newFixedThreadPool(64);

        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            Set<String> subnets = new LinkedHashSet<>();

            while (interfaces.hasMoreElements()) {
                NetworkInterface ni = interfaces.nextElement();
                if (!ni.isUp() || ni.isLoopback() || ni.isVirtual()) continue;
                for (InterfaceAddress addr : ni.getInterfaceAddresses()) {
                    InetAddress ia = addr.getAddress();
                    if (ia instanceof Inet4Address && !ia.isLoopbackAddress()) {
                        String ip = ia.getHostAddress();
                        String subnet = ip.substring(0, ip.lastIndexOf('.') + 1);
                        subnets.add(subnet);
                    }
                }
            }

            if (subnets.isEmpty()) {
                log.warn("No active IPv4 network interfaces found — cannot scan");
                return found;
            }

            log.info("Scanning subnets: {}", subnets);

            for (String subnet : subnets) {
                for (int i = 1; i <= 254; i++) {
                    final String ip = subnet + i;
                    executor.submit(() -> {
                        try (Socket socket = new Socket()) {
                            socket.connect(new InetSocketAddress(ip, ZPL_PORT), SCAN_TIMEOUT_MS);
                            log.info("Found ZPL printer at {}:{}", ip, ZPL_PORT);
                            found.add(new PrinterInfoDto("Imprimantă ZPL (" + ip + ")", ip, ZPL_PORT, "scan"));
                        } catch (IOException ignored) {}
                    });
                }
            }

            executor.shutdown();
            boolean finished = executor.awaitTermination(15, TimeUnit.SECONDS);
            if (!finished) {
                log.warn("Scan did not finish within 15s — returning partial results");
            }

        } catch (Exception e) {
            log.error("Scan failed: {}", e.getMessage(), e);
        } finally {
            executor.shutdownNow();
        }

        return found;
    }
}
