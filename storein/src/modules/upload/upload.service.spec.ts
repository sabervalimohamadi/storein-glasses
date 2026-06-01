import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadService } from './upload.service';
import { StorageProvider } from './storage/storage-provider.abstract';

jest.mock('sharp', () => {
  const chain = {
    resize:   jest.fn().mockReturnThis(),
    webp:     jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed-image')),
  };
  const sharpFn = jest.fn().mockReturnValue(chain);
  // __esModule:true tells __importStar to return sharpFn directly (stays callable)
  (sharpFn as any).__esModule = true;
  return sharpFn;
});

const mockFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File =>
  ({
    fieldname:    'file',
    originalname: 'test.jpg',
    encoding:     '7bit',
    mimetype:     'image/jpeg',
    size:         1024,
    buffer:       Buffer.from('fake-image-data'),
    ...overrides,
  } as Express.Multer.File);

const mockStorageResult = (key = 'products/test.webp') => ({
  key,
  url:      `http://localhost:3000/uploads/${key}`,
  filename: 'test.webp',
  size:     800,
  mimeType: 'image/webp',
});

describe('UploadService', () => {
  let service: UploadService;
  let storage: jest.Mocked<StorageProvider>;

  beforeEach(async () => {
    storage = {
      save:   jest.fn().mockResolvedValue(mockStorageResult()),
      delete: jest.fn().mockResolvedValue(undefined),
      getUrl: jest.fn().mockReturnValue('http://localhost:3000/uploads/test'),
    } as any;

    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'upload.maxFileSize') return 5 * 1024 * 1024;
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        { provide: StorageProvider, useValue: storage },
        { provide: ConfigService,   useValue: configService },
      ],
    }).compile();

    service = module.get(UploadService);
    jest.clearAllMocks();
  });

  // ── uploadImage ───────────────────────────────────────────────
  describe('uploadImage', () => {
    it('processes and saves image + thumbnail', async () => {
      storage.save
        .mockResolvedValueOnce(mockStorageResult('products/abc.webp'))
        .mockResolvedValueOnce(mockStorageResult('products/abc_thumb.webp'));

      const res = await service.uploadImage(mockFile(), 'products');

      expect(storage.save).toHaveBeenCalledTimes(2);
      expect(res.original.key).toBe('products/abc.webp');
      expect(res.thumbnail!.key).toBe('products/abc_thumb.webp');
    });

    it('saves only original when generateThumb is false', async () => {
      const res = await service.uploadImage(mockFile(), 'products', false);
      expect(storage.save).toHaveBeenCalledTimes(1);
      expect(res.thumbnail).toBeNull();
    });

    it('throws BadRequestException for invalid MIME type', async () => {
      await expect(
        service.uploadImage(mockFile({ mimetype: 'application/pdf' }), 'products'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws PayloadTooLargeException when file exceeds max size', async () => {
      await expect(
        service.uploadImage(mockFile({ size: 10 * 1024 * 1024 }), 'products'),
      ).rejects.toThrow(PayloadTooLargeException);
    });

    it('throws when no file provided', async () => {
      await expect(
        service.uploadImage(null as any, 'products'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── uploadImages ──────────────────────────────────────────────
  describe('uploadImages', () => {
    it('uploads multiple files', async () => {
      storage.save.mockResolvedValue(mockStorageResult());

      const files = [mockFile(), mockFile()];
      const res = await service.uploadImages(files, 'products');
      expect(res).toHaveLength(2);
    });

    it('throws when no files provided', async () => {
      await expect(service.uploadImages([], 'products'))
        .rejects.toThrow(BadRequestException);
    });

    it('throws when more than 10 files', async () => {
      const files = Array(11).fill(mockFile());
      await expect(service.uploadImages(files, 'products'))
        .rejects.toThrow(BadRequestException);
    });
  });

  // ── deleteFile ────────────────────────────────────────────────
  describe('deleteFile', () => {
    it('deletes original and thumbnail', async () => {
      await service.deleteFile('products/abc.webp');
      expect(storage.delete).toHaveBeenCalledWith('products/abc.webp');
      expect(storage.delete).toHaveBeenCalledWith('products/abc_thumb.webp');
    });

    it('does not throw when thumbnail does not exist', async () => {
      storage.delete
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('not found'));

      await expect(service.deleteFile('products/abc.webp')).resolves.not.toThrow();
    });
  });
});
