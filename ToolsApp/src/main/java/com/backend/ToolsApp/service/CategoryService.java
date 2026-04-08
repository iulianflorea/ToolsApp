package com.backend.ToolsApp.service;

import com.backend.ToolsApp.entity.Category;
import com.backend.ToolsApp.exception.BadRequestException;
import com.backend.ToolsApp.exception.ResourceNotFoundException;
import com.backend.ToolsApp.repository.CategoryRepository;
import com.backend.ToolsApp.security.SecurityUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;

    private Long tenantId() {
        return ((SecurityUser) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getTenantId();
    }

    public List<String> getAll() {
        return categoryRepository.findByTenantIdOrderByName(tenantId())
                .stream().map(Category::getName).toList();
    }

    @Transactional
    public String create(String name) {
        String trimmed = name.trim();
        if (trimmed.isEmpty()) throw new BadRequestException("Category name cannot be empty");
        Long tid = tenantId();
        if (categoryRepository.findByTenantIdAndNameIgnoreCase(tid, trimmed).isPresent()) {
            throw new BadRequestException("Category already exists: " + trimmed);
        }
        categoryRepository.save(new Category(tid, trimmed));
        return trimmed;
    }

    @Transactional
    public void delete(String name) {
        Long tid = tenantId();
        Category category = categoryRepository.findByTenantIdAndNameIgnoreCase(tid, name)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + name));
        categoryRepository.delete(category);
    }
}
