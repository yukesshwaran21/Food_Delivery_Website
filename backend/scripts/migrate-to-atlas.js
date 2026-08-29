import 'dotenv/config';
import { MongoClient } from 'mongodb';

const sourceUri = process.env.SOURCE_MONGODB_URI;
const targetUri = process.env.CONTACT_MONGODB_URI;

if (!sourceUri) {
    throw new Error('SOURCE_MONGODB_URI is required for migration.');
}
if (!targetUri) {
    throw new Error('CONTACT_MONGODB_URI is required for migration.');
}

const sourceClient = new MongoClient(sourceUri);
const targetClient = new MongoClient(targetUri);

try {
    await sourceClient.connect();
    await targetClient.connect();

    const sourceDb = sourceClient.db();
    const targetDb = targetClient.db();
    const collections = await sourceDb.listCollections().toArray();
    const migratableCollections = collections.filter(({ name }) => !name.startsWith('system.'));

    for (const { name } of migratableCollections) {
        const sourceDocuments = await sourceDb.collection(name).find({}).toArray();
        const targetCollection = targetDb.collection(name);
        const indexes = await targetCollection.listIndexes().toArray();
        const uniqueFields = indexes
            .filter((index) => index.unique && Object.keys(index.key).length === 1)
            .map((index) => Object.keys(index.key)[0]);
        const existingIds = new Set(
            (await targetCollection.find(
                { _id: { $in: sourceDocuments.map((document) => document._id) } },
                { projection: { _id: 1 } }
            ).toArray()).map((document) => String(document._id))
        );
        const missingDocuments = [];
        let skippedConflicts = 0;
        for (const document of sourceDocuments) {
            if (existingIds.has(String(document._id))) continue;
            const conflict = uniqueFields.some((field) => document[field] !== undefined && document[field] !== null);
            if (conflict) {
                const conflictDocument = await targetCollection.findOne({
                    $or: uniqueFields
                        .filter((field) => document[field] !== undefined && document[field] !== null)
                        .map((field) => ({ [field]: document[field] }))
                }, { projection: { _id: 1 } });
                if (conflictDocument) {
                    skippedConflicts += 1;
                    continue;
                }
            }
            missingDocuments.push(document);
        }

        if (missingDocuments.length > 0) {
            await targetCollection.insertMany(missingDocuments, { ordered: false });
        }

        console.log(`${name}: source=${sourceDocuments.length}, existing=${existingIds.size}, inserted=${missingDocuments.length}, skipped_conflicts=${skippedConflicts}`);
    }

    console.log('Migration completed without deleting or overwriting target documents.');
} finally {
    await Promise.all([sourceClient.close(), targetClient.close()]);
}
