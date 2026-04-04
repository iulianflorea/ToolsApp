package com.backend.ToolsApp.mapper;

import com.backend.ToolsApp.dto.user.UserRequest;
import com.backend.ToolsApp.dto.user.UserResponse;
import com.backend.ToolsApp.entity.User;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UserMapper {

    UserResponse toResponse(User user);

    List<UserResponse> toResponseList(List<User> users);

    @Mapping(target = "id",        ignore = true)
    @Mapping(target = "tenantId",  ignore = true)
    @Mapping(target = "password",  ignore = true)
    @Mapping(target = "active",    ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    User toEntity(UserRequest request);
}
