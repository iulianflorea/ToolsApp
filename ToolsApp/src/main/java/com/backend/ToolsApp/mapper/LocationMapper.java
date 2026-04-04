package com.backend.ToolsApp.mapper;

import com.backend.ToolsApp.dto.location.LocationRequest;
import com.backend.ToolsApp.dto.location.LocationResponse;
import com.backend.ToolsApp.entity.Location;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface LocationMapper {

    LocationResponse toResponse(Location location);

    List<LocationResponse> toResponseList(List<Location> locations);

    @Mapping(target = "id",       ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "active",   ignore = true)
    Location toEntity(LocationRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id",       ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    void updateEntity(LocationRequest request, @MappingTarget Location location);
}
