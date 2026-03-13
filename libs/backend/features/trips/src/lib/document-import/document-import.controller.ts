import {
  Controller,
  Post,
  Param,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '@org/guards';
import { DocumentImportService } from './document-import.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class DocumentImportController {
  constructor(private readonly documentImportService: DocumentImportService) {}

  @Post('trips/:tripId/import-document')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
      fileFilter: (_req, file, cb) => {
        const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only PDF, JPG, and PNG files are allowed'), false);
        }
      },
    }),
  )
  async importDocument(
    @Param('tripId') _tripId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.documentImportService.extractFromDocument(
      file.buffer,
      file.mimetype,
      file.originalname,
    );
  }
}
