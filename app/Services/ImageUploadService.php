<?php

namespace App\Services;

use Cloudinary\Api\Upload\UploadApi;
use Cloudinary\Configuration\Configuration;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;

class ImageUploadService
{
    protected $cloudinary;

    public function __construct()
    {
        // Configure Cloudinary
        Configuration::instance([
            'cloud' => [
                'cloud_name' => config('services.cloudinary.cloud_name'),
                'api_key' => config('services.cloudinary.api_key'),
                'api_secret' => config('services.cloudinary.api_secret'),
            ],
            'url' => [
                'secure' => true
            ]
        ]);

        $this->cloudinary = new UploadApi();
    }

    /**
     * Upload image to Cloudinary
     *
     * @param UploadedFile $file
     * @param string $folder
     * @return array|null
     */
    public function uploadImage(UploadedFile $file, string $folder = 'products'): ?array
    {
        try {
            // Validate file type
            if (!$file->isValid() || !in_array($file->getMimeType(), ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'])) {
                Log::error('Invalid file type for upload: ' . $file->getMimeType());
                return null;
            }

            // Validate file size (max 5MB)
            if ($file->getSize() > 5242880) {
                Log::error('File too large for upload: ' . $file->getSize());
                return null;
            }

            $uploadResult = $this->cloudinary->upload($file->getRealPath(), [
                'folder' => $folder,
                'transformation' => [
                    ['width' => 800, 'height' => 600, 'crop' => 'limit'],
                    ['quality' => 'auto']
                ]
            ]);

            return [
                'public_id' => $uploadResult['public_id'],
                'url' => $uploadResult['secure_url'],
                'format' => $uploadResult['format'],
                'bytes' => $uploadResult['bytes']
            ];
        } catch (\Exception $e) {
            Log::error('Cloudinary upload failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Delete image from Cloudinary
     *
     * @param string $publicId
     * @return bool
     */
    public function deleteImage(string $publicId): bool
    {
        try {
            $result = $this->cloudinary->destroy($publicId);
            return isset($result['result']) && $result['result'] === 'ok';
        } catch (\Exception $e) {
            Log::error('Cloudinary delete failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Extract public ID from Cloudinary URL
     *
     * @param string $url
     * @return string|null
     */
    public function extractPublicId(string $url): ?string
    {
        $pattern = '/\/v\d+\/(.+)\.\w+$/';
        if (preg_match($pattern, $url, $matches)) {
            return $matches[1];
        }
        return null;
    }
}
