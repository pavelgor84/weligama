import cloudinary from "./cloudinary";

export const UploadImage = async (fileName, folderName) => {

    const bytes = Buffer.from(await fileName.arrayBuffer());

    return new Promise(async (resolve, reject) => {
        await cloudinary.uploader.upload_stream({
            resource_type: 'auto',
            folder: folderName
        }, async (err, result) => {
            if (err) {
                return reject(err.message)
            }
            //console.log(result)
            return resolve(result)
        }).end(bytes)
    })

}