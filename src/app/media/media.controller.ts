import { Body, Controller, Delete, FileTypeValidator, Get, Inject, MaxFileSizeValidator, ParseFilePipe, Post, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthUser } from '../user/user.decorator/user.decorator';
import { User } from '../user/user.schema/user.schema';
import { MediaService } from './media.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard, PermissionGuard } from '../user/user.guards/user.guards';
import { DeleteFileDTO } from './media.dto/media.dto';

@Controller('api/v1/media')
@UseGuards(PermissionGuard)
@UseGuards(JwtAuthGuard)
export class MediaController {

    constructor(
        @Inject() private readonly mediaService: MediaService
    ) { }

    @Post("upload")
    @UseInterceptors(FilesInterceptor('files'))
    async upload(@AuthUser() user: User, @UploadedFiles(new ParseFilePipe({
        validators: [
            new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
            new FileTypeValidator({ fileType: 'application/pdf' }),
        ]
    })) files: Array<Express.Multer.File>) {
        return await this.mediaService.upload(user, files)
    }

    @Get("")
    async allFiles(@AuthUser() user: User) {
        return await this.mediaService.allFiles(user);
    }

    @Delete("")
    async deleteFiles (@AuthUser() user: User, @Body() files: DeleteFileDTO) {
        return await this.mediaService.delete(user, files)
    }

}
