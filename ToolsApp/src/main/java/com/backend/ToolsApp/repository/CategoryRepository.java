package com.backend.ToolsApp.repository;

import com.backend.ToolsApp.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByTenantIdOrderByName(Long tenantId);
    Optional<Category> findByTenantIdAndNameIgnoreCase(Long tenantId, String name);
}
