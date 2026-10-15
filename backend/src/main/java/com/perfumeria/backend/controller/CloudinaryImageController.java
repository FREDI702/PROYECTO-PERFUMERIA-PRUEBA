package com.perfumeria.backend.controller;

import com.perfumeria.backend.service.CloudinaryImageService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/imagenes")
public class CloudinaryImageController {

    private final CloudinaryImageService cloudinaryImageService;

    public CloudinaryImageController(CloudinaryImageService cloudinaryImageService) {
        this.cloudinaryImageService = cloudinaryImageService;
    }

    @GetMapping("/config")
    public CloudinaryImageService.PublicConfiguration publicConfiguration() {
        return cloudinaryImageService.publicConfiguration();
    }

    @PostMapping("/firma")
    public CloudinaryImageService.UploadSignature signUpload(@RequestBody UploadRequest request) {
        return cloudinaryImageService.signUpload(request == null ? null : request.publicId());
    }

    public record UploadRequest(String publicId) {}
}
