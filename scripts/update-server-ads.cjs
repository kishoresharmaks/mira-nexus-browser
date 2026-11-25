const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI not in process.env');
  process.exit(1);
}

(async () => {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'nexusbrowser');
  const coll = db.collection(process.env.MONGODB_COLLECTION || 'catalog');

  const ads = {
    enabled: true,
    bannerEnabled: true,
    rewardedEnabled: true,
    testMode: false,
    layout: 'inline',
    androidUnitId: 'ca-app-pub-3076513882745753/7545779992',
    iosUnitId: '',
    androidRewardedUnitId: 'ca-app-pub-3076513882745753/4482301258',
    iosRewardedUnitId: ''
  };

  const res = await coll.updateOne(
    { _id: 'catalog' },
    {
      $set: {
        'draft.ads': ads,
        'published.ads': ads,
        ads: ads
      }
    }
  );
  console.log('MongoDB update result:', res.matchedCount, 'matched,', res.modifiedCount, 'modified.');
  const doc = await coll.findOne({ _id: 'catalog' });
  console.log('Published ads:', JSON.stringify(doc?.published?.ads, null, 2));
  await client.close();
})().catch(console.error);
