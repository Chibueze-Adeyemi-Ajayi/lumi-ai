import { HttpException, HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { User } from '../user/user.schema/user.schema';
import { log } from 'console';
import { InjectModel } from '@nestjs/mongoose';
import { Media, MediaDocument } from './media.schema/media.schema';
import { Model } from 'mongoose';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { DeleteFileDTO } from './media.dto/media.dto';

const slugify = require('slugify');

@Injectable()
export class MediaService implements OnModuleInit {

    private logger = new Logger(MediaService.name);
    private AZURE_BLOB_SERVICE_CLIENT: BlobServiceClient;
    private containerName = process.env.AZURE_CONTAINER;

    constructor( 
        @InjectModel(Media.name) private readonly media: Model<MediaDocument>
    ) { }

    async onModuleInit() {
        this.logger.debug("Initiating Azure storage");
        await this.initAzureBlobStorage()
    }

    private generateRandomSlug(length = 6) {
        const charSet = 'abcdefghijklmnopqrstuvwxyz-0123456789';
        let randomString = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charSet.length);
            randomString += charSet.charAt(randomIndex);
        }
        return randomString;
    }

    private async uploadFiles(files: Array<any>) {
        try {

            let images = [], image_base_url = `https://campaignbucket.blob.core.windows.net/${this.containerName}`;

            for (let _file of files) {

                let { path, originalname, mimetype, encoding, buffer } = _file;//, file = fs.readFileSync(path);

                let name = originalname;

                originalname = this.generateRandomSlug(10) + "-" + originalname;
                originalname = slugify(originalname)

                const containerClient = this.AZURE_BLOB_SERVICE_CLIENT.getContainerClient(this.containerName);
                const blockBlobClient = await containerClient.getBlockBlobClient(originalname);

                let _data = await blockBlobClient.upload(buffer, buffer.length)

                let url = `${image_base_url}/${originalname}`

                images.push({ url, name, originalname });
                log({ "upload-data": _data });
            }

            return images;

        } catch (error: any) {
            this.logger.error("Upload Error: ", error)
            return null;
        }
    }

    private async initAzureBlobStorage() {
        let accountName = process.env.AZURE_BLOB_ACCOUNT_NAME, accountKey = process.env.AZURE_BLOB_ACCOUNT_KEY;
        const storageAccountBaseUrl = `https://${accountName}.blob.core.windows.net`,
            sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
        this.AZURE_BLOB_SERVICE_CLIENT = new BlobServiceClient(
            storageAccountBaseUrl,
            sharedKeyCredential
        );
        this.logger.debug("Done initializing Azure Blob storage")
    }

    private async deleteFiles(names: string[]): Promise<boolean> {
        try {

            for (const fileName of names) {
                const containerClient = this.AZURE_BLOB_SERVICE_CLIENT.getContainerClient(this.containerName);
                const blockBlobClient = await containerClient.getBlockBlobClient(
                    fileName.replace(`https://campaignbucket.blob.core.windows.net/${this.containerName}/`, "")
                );
                await blockBlobClient.deleteIfExists();
            }

            return true;

        } catch (error) {
            log({ error })
            return false;
        }
    }

    async upload(user: User, files: Array<Express.Multer.File>) {

        let data: Array<{ url: string, name: string, originalname: string }> | null = await this.uploadFiles(files);
        if (!data) throw new HttpException({ reason: "Error uploading media(s)" }, HttpStatus.CONFLICT);

        for (const upload of data) {
            let { url, name, originalname } = upload;
            await (new this.media({ url, name, originalname, userId: (<any>user).id })).save()
        }

        return {
            message: "Upload successful",
            data: await this.allFiles(user)
        }
    }

    async allFiles (user: User) {
        return await this.media.find({userId: (<any>user).id});
    }

    async delete (user: User, files: DeleteFileDTO) {
        let fileNames = [];
        for (const id of files.files) {
            let _media = await this.media.findById(id);
            if (!_media) continue;
            fileNames.push(_media.originalname)
            await this.media.findByIdAndDelete(id)
        }
        await this.deleteFiles(fileNames)
        return {
            message: "Media documents deleted successfully",
            data: []
        }
    }

    async load (id: string) {
        return this.media.findById(id);
    }

}
