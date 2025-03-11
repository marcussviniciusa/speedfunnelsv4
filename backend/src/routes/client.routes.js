/**
 * Arquivo temporário para resolver o erro de importação.
 * Este arquivo deve ser removido assim que a imagem do backend for atualizada corretamente.
 */

const express = require('express');
const router = express.Router();

// Rota vazia como placeholder
router.get('/', (req, res) => {
  res.status(404).json({
    error: 'Este endpoint foi descontinuado. Por favor, use as rotas OAuth oficiais.'
  });
});

module.exports = router;
