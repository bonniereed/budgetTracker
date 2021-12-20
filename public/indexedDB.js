let db;
let budget;

// mongoose.connect(
//     process.env.PORT || '0.0.0.0' || 'mongodb://localhost/budget',
//     {
//         useNewUrlParser: true,
//         useFindAndModify: false,
//         useUnifiedTopology: true,
//     }
// );

const summon = indexedDB.open('budgetDB', budget);

summon.onupgradeneeded = function (event) {
    const { oldVersion } = event;
    const newVersion = event.newVersion || db.version;

    console.log(`${oldVersion} upgraded to ${newVersion}`);

    db = event.target.result;

    if (db.objectStoreNames.length === 0) {
        db.createObjectStore('StoredBudget', { autoIncrement: true });
    }
};

summon.onerror = function (event) {
    console.log(`Error: ${event.target.errorCode}`);
};

function storedDB() {
    let transaction = db.transaction(['StoredBudget'], 'readwrite');

    const store = transaction.objectStore('StoredBudget');

    const getEntries = store.getEntries();

    getEntries.onsuccess = function () {
        if (getEntries.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getEntries.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                },
            })
                .then((response) => response.json())
                .then((res) => {
                    if (res.length !== 0) {
                        transaction = db.transaction(
                            ['StoredBudget'],
                            'readwrite'
                        );

                        const currentStore =
                            transaction.objectStore('StoredBudget');

                        currentStore.clear();
                    }
                });
        }
    };
}

summon.onsuccess = function (event) {
    db = event.target.result;

    if (navigator.onLine) {
        storedDB();
    }
};

const saveRecordedCache = (recordedCache) => {
    const transaction = db.transaction(['StoredBudget'], 'readwrite');

    const store = transaction.objectStore('StoredBudget');

    store.add(recordedCache);
};

window.addEventListener('online', storedDB);
