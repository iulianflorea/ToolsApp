package com.backend.ToolsApp.config;

import com.backend.ToolsApp.entity.Tenant;
import com.backend.ToolsApp.entity.User;
import com.backend.ToolsApp.enums.SubscriptionPlan;
import com.backend.ToolsApp.enums.UserRole;
import com.backend.ToolsApp.repository.TenantRepository;
import com.backend.ToolsApp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.existsByEmail("admin@singularity-cloud.com")) {
            return;
        }

        log.info("Creating default admin account...");

        Tenant tenant = new Tenant();
        tenant.setName("Singularity Cloud");
        tenant.setSubscriptionPlan(SubscriptionPlan.PRO);
        tenant = tenantRepository.save(tenant);

        User admin = new User();
        admin.setTenantId(tenant.getId());
        admin.setEmail("admin@singularity-cloud.com");
        admin.setPassword(passwordEncoder.encode("rgbiuli1"));
        admin.setFullName("Admin");
        admin.setRole(UserRole.ADMIN);
        User saved = userRepository.save(admin);
        saved.setQrCode(String.valueOf(saved.getId()));
        userRepository.save(saved);

        log.info("Default admin created: admin@singularity-cloud.com");
    }
}
