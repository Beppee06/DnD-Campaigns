// script.js
// Riferimenti agli elementi HTML
const campaignsDiv = document.getElementById('campaignsDiv');
const newCampaignDiv = document.getElementById('newCampaignDiv');
const addNewCampaignButton = document.getElementById('addNewCampaignButton');
const saveNewCampaignButton = document.getElementById('saveNewCampaignButton');
const newCampaignName = document.getElementById('newCampaignName');
const campaignList = document.getElementById('campaignList'); // Assicurati di avere <div id="campaignList"></div> nel tuo HTML

// Variabile per i dati, inizializzata a vuoto e popolata da IndexedDB
let dbData = { "campaigns": [] };

// --- Costanti per IndexedDB ---
const DB_NAME = 'DndCampaignTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'campaigns'; // Lo store (tabella) per le tue campagne

let db; // La variabile per il database IndexedDB

// --- Funzioni per IndexedDB ---

function openDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('Errore nell\'apertura del database:', event.target.error);
            reject(event.target.error);
        };

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            // Crea l'object store (simile a una tabella) se non esiste
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                console.log('Object store "campaigns" creato.');
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('Database IndexedDB aperto con successo.');
            resolve(db);
        };
    });
}

async function loadCampaignsFromDb() {
    await openDb(); // Assicurati che il DB sia aperto

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.getAll(); // Ottieni tutti gli oggetti dallo store

        request.onerror = (event) => {
            console.error('Errore nel caricamento delle campagne:', event.target.error);
            dbData.campaigns = []; // Inizializza a vuoto in caso di errore
            resolve(dbData.campaigns);
        };

        request.onsuccess = (event) => {
            dbData.campaigns = event.target.result || []; // Ottieni i risultati o un array vuoto
            console.log('Campagne caricate da IndexedDB:', dbData.campaigns);
            resolve(dbData.campaigns);
        };
    });
}

async function saveCampaignsToDb(campaignsArray) {
    await openDb(); // Assicura che il DB sia aperto

    // Per semplicità, cancelliamo tutto e reinseriamo.
    // In un'applicazione reale potresti fare operazioni più mirate (add, put, delete).
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);

        // Pulisci lo store
        const clearRequest = objectStore.clear();
        clearRequest.onerror = event => {
            console.error('Errore nella pulizia dello store:', event.target.error);
            reject(event.target.error);
        };
        clearRequest.onsuccess = () => {
            // Reinserisci tutte le campagne
            let putPromises = [];
            campaignsArray.forEach(campaign => {
                const putRequest = objectStore.put(campaign); // put() aggiorna o aggiunge
                putPromises.push(new Promise((res, rej) => {
                    putRequest.onsuccess = () => res();
                    putRequest.onerror = () => rej(putRequest.error);
                }));
            });

            Promise.all(putPromises)
                .then(() => {
                    console.log('Tutte le campagne salvate in IndexedDB.');
                    resolve();
                })
                .catch(error => {
                    console.error('Errore nel salvataggio di una campagna:', error);
                    reject(error);
                });
        };

        transaction.onerror = (event) => {
            console.error('Errore nella transazione di salvataggio:', event.target.error);
            reject(event.target.error);
        };
        transaction.oncomplete = () => {
            // console.log('Transazione di salvataggio completata.');
        };
    });
}

// --- Funzioni di gestione UI ---

async function loadTheCampaignsUI() {
    await loadCampaignsFromDb(); // Carica i dati da IndexedDB

    if (campaignList) {
        campaignList.innerHTML = ''; // Pulisci la lista esistente

        if (dbData.campaigns.length === 0) {
            const message = document.createElement('p');
            message.textContent = 'Nessuna campagna aggiunta. Clicca "Add new campaign" per iniziare!';
            campaignList.appendChild(message);
        } else {
            dbData.campaigns.forEach(campaign => {
                const campaignElement = document.createElement('div');
                campaignElement.classList.add('campaign-item');
                campaignElement.textContent = campaign.name; // Mostra il nome della campagna
                campaignList.appendChild(campaignElement);
            });
        }
    } else {
        console.warn("Elemento con id 'campaignList' non trovato. Impossibile visualizzare le campagne.");
    }
}

// --- Event Listeners ---

addNewCampaignButton.addEventListener('click', () => {
    newCampaignDiv.style.display = 'block';
    newCampaignName.value = '';
    newCampaignName.focus();
});

saveNewCampaignButton.addEventListener('click', async () => {
    const newName = newCampaignName.value.trim();
    if (newName) {
        // Assegna un ID solo se non esiste (utile per operazioni di put())
        const newCampaign = { name: newName, id: Date.now() }; // autoIncrement gestirà l'ID se non specificato
        dbData.campaigns.push(newCampaign);
        console.log('Nuova campagna aggiunta in memoria:', dbData);

        await saveCampaignsToDb(dbData.campaigns); // Salva i dati in IndexedDB

        newCampaignName.value = '';
        newCampaignDiv.style.display = 'none';
        loadTheCampaignsUI(); // Aggiorna la visualizzazione
    } else {
        alert('Il nome della campagna non può essere vuoto.');
    }
});


// --- Inizializzazione ---

document.addEventListener('DOMContentLoaded', () => {
    console.log("App D&D Tracker caricata.");
    newCampaignDiv.style.display = 'none';
    campaignsDiv.style.display = 'block'; // Mostra direttamente l'area delle campagne
    loadTheCampaignsUI(); // Carica e visualizza i dati all'avvio
});

// Opzionale: Registra un Service Worker per funzionalità PWA complete (offline, installazione)
// Questo va in un file separato (es. service-worker.js) e registrato qui:
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/DnD-Campaigns/service-worker.js') // Assicurati che questo percorso sia corretto
            .then(registration => {
                console.log('ServiceWorker registrato con successo:', registration);
            })
            .catch(error => {
                console.error('Registrazione ServiceWorker fallita:', error);
            });
    });
}