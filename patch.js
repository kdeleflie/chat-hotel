const fs = require('fs');
let code = fs.readFileSync('src/DailyTrackingView.tsx', 'utf8');
code = code.replace(
  'if (!res.ok) throw new Error("Erreur serveur");',
  'if (!res.ok) { const errData = await res.json(); throw new Error(errData.error || "Erreur serveur"); }'
);
code = code.replace(
  'showToast("Erreur lors de la sauvegarde", "error");',
  'showToast(`Erreur lors de la sauvegarde: ${err.message}`, "error");'
);
fs.writeFileSync('src/DailyTrackingView.tsx', code);
