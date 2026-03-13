import { Module } from '@nestjs/common';
import { DocumentImportController } from './document-import.controller';
import { DocumentImportService } from './document-import.service';

@Module({
  controllers: [DocumentImportController],
  providers: [DocumentImportService],
})
export class DocumentImportModule {}
