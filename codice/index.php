<?php
session_start(); // Inizia la sessione PHP

// Recupera l'ID del file database dalla sessione, se presente
$dbFilePath = $_SESSION['db_file_path'] ?? null;
$dbFileName = null;
if ($dbFilePath) {
    $dbFileName = basename($dbFilePath); // Ottiene solo il nome del file
}

// Puoi anche recuperare l'ultima campagna ID dalla sessione se vuoi
$lastOpenedCampaignId = $_SESSION['last_opened_campaign_id'] ?? null;
?>
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>D&D Campaign Tracker</title>
    <link rel="stylesheet" href="style.css">
    <!-- Puoi passare variabili PHP a JavaScript in questo modo -->
    <script type="text/javascript">
        // Variabili globali JavaScript inizializzate da PHP
        window.APP_CONFIG = {
            dbFileName: <? php echo json_encode($dbFileName); ?>,
            lastOpenedCampaignId: <? php echo json_encode($lastOpenedCampaignId); ?>
            };
    </script>
</head>
<body>
    <header>
        <h1>D&D Campaign Tracker</h1>
        <div id="fileStatus">
            <?php if ($dbFileName): ?>
            Database caricato: <strong><?php echo htmlspecialchars($dbFileName); ?></strong>
            <button id="changeFileButton">Cambia Database</button>
            <?php else: ?>
            <input type="file" id="jsonFileInput" accept=".json">
            <?php endif; ?>
        </div>
        <button id="saveFileButton" style="display: none;">Salva e Scarica Database Aggiornato</button>
    </header>

    <main id="appContent" style="display: <?php echo ($dbFileName ? 'block' : 'none'); ?>;">
        <!-- Sezioni per campagne, personaggi, moduli, come prima -->
        <section id="campaignSelection">
            <h2>Seleziona Campagna</h2>
            <select id="campaignSelect">
                <!-- Le opzioni saranno popolate via JS -->
            </select>
            <button id="addCampaignButton">Nuova Campagna</button>
            <div id="newCampaignForm" style="display: none;">
                <input type="text" id="newCampaignName" placeholder="Nome Nuova Campagna">
                <button id="confirmAddCampaignButton">Crea</button>
            </div>
        </section>

        <section id="characterList">
            <h2>Personaggi della Campagna: <span id="currentCampaignName"></span></h2>
            <button id="addCharacterButton">Aggiungi Nuovo Personaggio</button>
            <div id="characterForm" style="display: none;">
                <h3>Aggiungi/Modifica Personaggio</h3>
                <input type="hidden" id="characterId">
                <label for="charName">Nome:</label><input type="text" id="charName"><br>
                <label for="charRace">Razza:</label><input type="text" id="charRace"><br>
                <label for="charClass">Classe:</label><input type="text" id="charClass"><br>
                <label for="charNotes">Note:</label><textarea id="charNotes"></textarea><br>
                <button id="saveCharacterButton">Salva Personaggio</button>
                <button id="cancelCharacterButton">Annulla</button>
            </div>
            <ul id="charactersDisplay">
                <!-- Qui verranno listati i personaggi -->
            </ul>
        </section>
    </main>

    <script src="script.js"></script>
</body>
</html>