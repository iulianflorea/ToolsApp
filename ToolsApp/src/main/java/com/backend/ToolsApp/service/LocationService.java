package com.backend.ToolsApp.service;

import com.backend.ToolsApp.dto.location.LocationRequest;
import com.backend.ToolsApp.dto.location.LocationResponse;
import com.backend.ToolsApp.entity.Location;
import com.backend.ToolsApp.exception.ResourceNotFoundException;
import com.backend.ToolsApp.mapper.LocationMapper;
import com.backend.ToolsApp.repository.LocationRepository;
import com.backend.ToolsApp.security.SecurityUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LocationService {

    private final LocationRepository locationRepository;
    private final LocationMapper locationMapper;

    private Long tenantId() {
        return ((SecurityUser) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getTenantId();
    }

    public List<LocationResponse> getAll() {
        return locationMapper.toResponseList(locationRepository.findByTenantId(tenantId()));
    }

    @Transactional
    public LocationResponse create(LocationRequest request) {
        Location location = locationMapper.toEntity(request);
        location.setTenantId(tenantId());
        return locationMapper.toResponse(locationRepository.save(location));
    }

    @Transactional
    public LocationResponse update(Long id, LocationRequest request) {
        Location location = locationRepository.findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Location not found: " + id));
        locationMapper.updateEntity(request, location);
        return locationMapper.toResponse(locationRepository.save(location));
    }

    @Transactional
    public void delete(Long id) {
        Location location = locationRepository.findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Location not found: " + id));
        location.setActive(false);
        locationRepository.save(location);
    }
}
