let db;
let budgetVersion;

// creating new open request for the budget database
const request = indexedDB.open('BudgetDB', budgetVersion || 21);

//upgrade db if necessary
request.onupgradeneeded = function (e) {
  console.log('Upgrade needed in IndexDB');

  const { oldVersion } = e;
  const newVersion = e.newVersion || db.version;

  console.log(`DB Updated from version ${oldVersion} to ${newVersion}`);

  db = e.target.result;

  if (db.objectStoreNames.length === 0) {
    db.createObjectStore('BudgetStore', { autoIncrement: true });
  }
};

//display error message
request.onerror = function (e) {
  console.log(`Error: ${e.target.errorCode}`);
};

function checkDatabase() {
  console.log('checking db');

  // store object store data in a variable
  let transaction = db.transaction(['BudgetStore'], 'readwrite');
  const store = transaction.objectStore('BudgetStore');
  const getAll = store.getAll();

  
  getAll.onsuccess = function () {
    // on success, post everything in bulk to backend
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then((res) => {
          if (res.length !== 0) {
            //open new transaction to clear budget store
            transaction = db.transaction(['BudgetStore'], 'readwrite');
            const currentStore = transaction.objectStore('BudgetStore');
            currentStore.clear();
            console.log('Store Cleared');
          }
        });
    }
  };
}

request.onsuccess = function (e) {
  console.log('success');
  db = e.target.result;

  // read db once back online
  if (navigator.onLine) {
    console.log('backend is online');
    checkDatabase();
  }
};

const saveRecord = (record) => {
  console.log('record saved');
  // saving record
  const transaction = db.transaction(['BudgetStore'], 'readwrite');
  const store = transaction.objectStore('BudgetStore');
  store.add(record);
};

// listen for when the app comes back online
window.addEventListener('online', checkDatabase);
