let db;

const request = indexedDB.open('budget-tracker', 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new-item', { autoIncrement: true });
  };

  request.onsuccess = function(event) {
    db = event.target.result;
  
    // is app online?
    if (navigator.onLine) {
      uploadTransaction();
    }
  };
  
  request.onerror = function(event) {
    console.log(event.target.errorCode);
  };

  // There is no internet connection
function saveRecord(record) {
    // save the transaction locally, allowing for updates later
    const transaction = db.transaction(['new-item'], 'readwrite');
  
    const budgetObjectStore = transaction.objectStore('new-item');
  
    // add record locally
    budgetObjectStore.add(record);
  };

  function uploadTransaction() {
    const transaction = db.transaction(['new-item'], 'readwrite');
    
    const budgetObjectStore = transaction.objectStore('new-item');

    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function() {
        // if there is data send it to the api
        if (getAll.result.length > 0 ) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverSays => {
                if (serverSays.message) {
                    throw new Error(serverSays);
                }

                const transaction = db.transaction(['new-item'], 'readwrite');
                const budgetObjectStore = transaction.objectStore('new-item');
                // clear the IDB store
                budgetObjectStore.clear();
             })
             .catch(err => {
                 console.log(err);
             });
        }
    }

    // listen for online state
    window.addEventListener('online', uploadTransaction);
  };