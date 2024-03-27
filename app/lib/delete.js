import cloudinary from "./cloudinary";

export const DeleteImage = async (public_id) => {

    return new Promise(async (resolve, reject) => {

        try {
            const result = await cloudinary.uploader.destroy(public_id)
            return resolve(result)

        } catch (error) {
            return reject(new Error(error.message))
        }
    })

}