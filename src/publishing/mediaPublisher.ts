import { HttpClient } from "@paperbits/common/http";
import { IPublisher } from "@paperbits/common/publishing";
import { IBlobStorage } from "@paperbits/common/persistence";
import { IMediaService, MediaContract } from "@paperbits/common/media";
import { Logger } from "@paperbits/common/logging";


export class MediaPublisher implements IPublisher {
    constructor(
        private readonly mediaService: IMediaService,
        private readonly blobStorage: IBlobStorage,
        private readonly outputBlobStorage: IBlobStorage,
        private readonly httpClient: HttpClient,
        private readonly logger: Logger
    ) { }

    private async renderMediaFile(mediaFile: MediaContract): Promise<void> {
        try {
            if (mediaFile.blobKey) {
                const blob = await this.blobStorage.downloadBlob(mediaFile.blobKey);

                if (blob) {
                    await this.outputBlobStorage.uploadBlob(mediaFile.permalink, blob, mediaFile.mimeType);
                    return;
                }
            }

            if (mediaFile.downloadUrl) { // if blob doesn't exit check if direct download URL is specifed:
                const response = await this.httpClient.send({ url: mediaFile.downloadUrl });

                if (response?.statusCode === 200) {
                    await this.outputBlobStorage.uploadBlob(mediaFile.permalink, response.toByteArray(), mediaFile.mimeType);
                }
                else {
                    this.logger.trackEvent("Publishing", { message: `Could not download media ${mediaFile.fileName}` });
                }
            }
        }
        catch (error) {
            throw new Error(`Unable to render media file. ${error.stack || error.message}`);
        }
    }

    private async renderMedia(mediaFiles: MediaContract[]): Promise<void> {
        const mediaPromises = new Array<Promise<void>>();

        mediaFiles.forEach(mediaFile => {
            this.logger.trackEvent("Publishing", { message: `Publishing media ${mediaFile.fileName}...` });
            mediaPromises.push(this.renderMediaFile(mediaFile));
        });

        await Promise.all(mediaPromises);
    }

    public async publish(): Promise<void> {
        const mediaFiles = await this.mediaService.search();
        await this.renderMedia(mediaFiles);
    }
}