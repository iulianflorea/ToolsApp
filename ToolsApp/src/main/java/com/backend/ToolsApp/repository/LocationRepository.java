package com.backend.ToolsApp.repository;

import com.backend.ToolsApp.entity.Location;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LocationRepository extends JpaRepository<Location, Long> {
    List<Location> findByTenantId(Long tenantId);
    List<Location> findByTenantIdAndActiveTrue(Long tenantId);
    Optional<Location> findByIdAndTenantId(Long id, Long tenantId);
}
