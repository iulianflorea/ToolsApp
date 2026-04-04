package com.backend.ToolsApp.config;

import com.backend.ToolsApp.entity.*;
import com.backend.ToolsApp.enums.*;
import com.backend.ToolsApp.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final AssetRepository assetRepository;
    private final LocationRepository locationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (tenantRepository.existsByName("Demo Company")) {
            log.info("Demo data already exists, skipping initialization");
            return;
        }

        log.info("Initializing demo data...");

        // Tenant
        Tenant tenant = new Tenant();
        tenant.setName("Demo Company");
        tenant.setSubscriptionPlan(SubscriptionPlan.PRO);
        tenant = tenantRepository.save(tenant);
        Long tid = tenant.getId();

        // Users
        createUser(tid, "admin@demo.com", "admin123", "Admin User", UserRole.ADMIN);
        createUser(tid, "manager@demo.com", "manager123", "Maria Manager", UserRole.MANAGER);
        createUser(tid, "worker@demo.com", "worker123", "John Worker", UserRole.WORKER);

        // Locations
        Location warehouse = createLocation(tid, "Main Warehouse", "123 Industrial Ave", LocationType.WAREHOUSE);
        Location site1 = createLocation(tid, "Job Site Alpha", "456 Construction Blvd", LocationType.JOB_SITE);
        createLocation(tid, "Head Office", "789 Corporate St", LocationType.OFFICE);

        // Assets
        createAsset(tid, "Hydraulic Drill Press",   "HD-001", "Power Tools",   AssetStatus.AVAILABLE,      "2023-01-15", 2500.00);
        createAsset(tid, "Industrial Angle Grinder","AG-002", "Power Tools",   AssetStatus.IN_USE,         "2023-02-10", 350.00);
        createAsset(tid, "Safety Harness Set",      "SH-003", "Safety",        AssetStatus.AVAILABLE,      "2023-03-05", 180.00);
        createAsset(tid, "Electric Forklift",       "EF-004", "Heavy Machinery",AssetStatus.IN_MAINTENANCE,"2022-11-20", 45000.00);
        createAsset(tid, "Portable Generator 5kW",  "PG-005", "Power",         AssetStatus.AVAILABLE,      "2023-04-12", 1200.00);
        createAsset(tid, "Laser Level Kit",         "LL-006", "Measurement",   AssetStatus.AVAILABLE,      "2023-05-08", 420.00);
        createAsset(tid, "Concrete Mixer 350L",     "CM-007", "Construction",  AssetStatus.IN_USE,         "2022-09-30", 3200.00);
        createAsset(tid, "Scaffolding Set (20m)",   "SC-008", "Construction",  AssetStatus.AVAILABLE,      "2022-07-15", 5500.00);
        createAsset(tid, "Digital Multimeter Pro",  "DM-009", "Electrical",    AssetStatus.AVAILABLE,      "2023-06-01", 280.00);
        createAsset(tid, "Pneumatic Nail Gun",      "PN-010", "Power Tools",   AssetStatus.RETIRED,        "2020-01-10", 450.00);

        log.info("Demo data initialized: 1 tenant, 3 users, 3 locations, 10 assets");
    }

    private void createUser(Long tenantId, String email, String password, String fullName, UserRole role) {
        User user = new User();
        user.setTenantId(tenantId);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setFullName(fullName);
        user.setRole(role);
        userRepository.save(user);
    }

    private Location createLocation(Long tenantId, String name, String address, LocationType type) {
        Location location = new Location();
        location.setTenantId(tenantId);
        location.setName(name);
        location.setAddress(address);
        location.setType(type);
        return locationRepository.save(location);
    }

    private void createAsset(Long tenantId, String name, String serial, String category,
                              AssetStatus status, String purchaseDate, double price) {
        Asset asset = new Asset();
        asset.setTenantId(tenantId);
        asset.setName(name);
        asset.setSerialNumber(serial);
        asset.setCategory(category);
        asset.setStatus(status);
        asset.setPurchaseDate(LocalDate.parse(purchaseDate));
        asset.setPurchasePrice(BigDecimal.valueOf(price));
        assetRepository.save(asset);
    }
}
