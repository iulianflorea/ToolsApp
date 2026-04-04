package com.backend.ToolsApp.mapper;

import com.backend.ToolsApp.dto.asset.AssetRequest;
import com.backend.ToolsApp.dto.asset.AssetResponse;
import com.backend.ToolsApp.entity.Asset;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface AssetMapper {

    @Mapping(target = "warrantyExpiresAt", expression = "java(asset.getPurchaseDate() != null && asset.getWarrantyMonths() != null ? asset.getPurchaseDate().plusMonths(asset.getWarrantyMonths()) : null)")
    AssetResponse toResponse(Asset asset);

    List<AssetResponse> toResponseList(List<Asset> assets);

    @Mapping(target = "id",        ignore = true)
    @Mapping(target = "tenantId",  ignore = true)
    @Mapping(target = "qrCode",    ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    Asset toEntity(AssetRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id",        ignore = true)
    @Mapping(target = "tenantId",  ignore = true)
    @Mapping(target = "qrCode",    ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    void updateEntity(AssetRequest request, @MappingTarget Asset asset);
}
