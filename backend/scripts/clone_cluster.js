const mongoose = require("mongoose");

// SOURCE CLUSTER (Jahan se data sirf READ hoga - Isme se kuch bhi delete ya cut nahi hoga)
const SOURCE_URI =
  "mongodb+srv://tradex615_db_user:Wpobpluj3z7XTeqa@cluster0.expwc3u.mongodb.net/horizoncap?retryWrites=true&w=majority&appName=Cluster0";

// TARGET CLUSTER (Jisme data copy/paste hoga testing ke liye)
const TARGET_URI =
  "mongodb+srv://kumar041232_db_user:YvRKiVL3WJZbXAHe@cluster0.btrm7wb.mongodb.net/horizoncap?retryWrites=true&w=majority&appName=Cluster0";

async function cloneDatabase() {
  console.log("=================================================");
  console.log("   SAFE DATABASE CLONING (COPY ONLY - NO CUT)");
  console.log("=================================================");
  console.log("Connecting to Source Cluster (tradex615)...");
  
  const sourceConn = await mongoose.createConnection(SOURCE_URI).asPromise();
  console.log(" Connected to Source (tradex615). Status: READ ONLY.");

  console.log("Connecting to Target Cluster (kumar041232)...");
  const targetConn = await mongoose.createConnection(TARGET_URI).asPromise();
  console.log(" Connected to Target (kumar041232). Status: WRITE TARGET.\n");

  const collections = await sourceConn.db.listCollections().toArray();
  console.log(`Found ${collections.length} collections in source database to copy.\n`);

  for (const col of collections) {
    const colName = col.name;
    if (colName.startsWith("system.")) continue;

    // 1. Fetch total count from source
    const count = await sourceConn.db.collection(colName).countDocuments();
    process.stdout.write(`Copying "${colName}" (${count} documents)... `);

    if (count > 0) {
      // 2. Read documents from source (ONLY READ, no modification to source)
      const docs = await sourceConn.db.collection(colName).find({}).toArray();

      // 3. Target collection agar pehle se bana ho toh use reset karein taaki fresh copy aaye
      try {
        await targetConn.db.collection(colName).drop();
      } catch (err) {
        // Target doesn't exist yet, fine
      }

      // 4. Insert duplicate copy into target
      await targetConn.db.collection(colName).insertMany(docs);
    }

    // 5. Copy indexes to keep queries fast on test cluster
    try {
      const indexes = await sourceConn.db.collection(colName).indexes();
      for (const idx of indexes) {
        if (idx.name === "_id_") continue;
        const keys = idx.key;
        const options = { ...idx };
        delete options.key;
        delete options.v;
        delete options.ns;
        await targetConn.db.collection(colName).createIndex(keys, options);
      }
    } catch (idxErr) {
      // Skip if index conflicts
    }

    console.log("DONE");
  }

  console.log("\n=================================================");
  console.log(" SUCCESS: All data successfully CLONED / COPIED!");
  console.log(" Source Cluster (tradex615) is 100% UNTOUCHED and SAFE.");
  console.log(" Target Cluster (kumar041232) is ready for testing.");
  console.log("=================================================");

  await sourceConn.close();
  await targetConn.close();
  process.exit(0);
}

cloneDatabase().catch((err) => {
  console.error("\n Error during database cloning:", err);
  process.exit(1);
});
