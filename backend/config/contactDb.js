import mongoose from 'mongoose';

const contactConnection = mongoose.createConnection();
const contactDatabaseName = 'Food-delivery-website';

const connectContactDB = async () => {
    const contactMongoUri = process.env.CONTACT_MONGODB_URI;

    if (!contactMongoUri) {
        const error = new Error('CONTACT_MONGODB_URI is not configured.');
        console.error(`Contact database connection failed: ${error.message}`);
        throw error;
    }

    try {
        await contactConnection.openUri(contactMongoUri, { dbName: contactDatabaseName });
        console.log('Contact database connected successfully');
    } catch (error) {
        console.error(`Contact database connection failed: ${error.message}`);
        throw error;
    }
};

export { contactConnection, connectContactDB };