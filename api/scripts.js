const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const SCRIPTS_DIR = path.join(__dirname, '../../scripts');

router.get('/', (req, res) => {
  try {
    if (!fs.existsSync(SCRIPTS_DIR)) {
      return res.json([]);
    }
    
    const files = fs.readdirSync(SCRIPTS_DIR);
    const results = [];

    for (const file of files) {
      if (!file.endsWith('.js')) continue;

      const filePath = path.join(SCRIPTS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      let title = file;
      let descriptionLines = [];
      let foundComments = false;
      
      for (let line of lines) {
        line = line.trim();
        if (line.startsWith('//')) {
          foundComments = true;
          let text = line.substring(2).trim();
          
          // Essaye de détecter le pattern classique: "nom_script.js — Description"
          if (text.startsWith(file)) {
            let potentialTitle = text.substring(file.length).replace(/^[—\s-]+/, '').trim();
            if (potentialTitle) {
              title = potentialTitle;
            }
          // Ignorer les lignes de headers style "───" 
          } else if (text !== '' && !/^─+$/.test(text)) {
            descriptionLines.push(text);
          }
        } else if (line === '' && !foundComments) {
          // keep searching for comments if we only saw empty lines at start
          continue; 
        } else {
          // stop reading comments if we hit code
          break;
        }
      }

      results.push({
        name: file,
        title: title, // Le widget utilisera item.primary = "title" ou "name" selon le widgets.json
        description: descriptionLines.join(' '),
        path: `scripts/${file}`
      });
    }

    res.json(results);
  } catch (error) {
    console.error('Erreur lecture scripts:', error);
    res.status(500).json({ error: 'Erreur lors de la lecture des scripts' });
  }
});

module.exports = router;
