// Pornirea serverului si a verificarii periodice a dozelor
const app = require('./app');
const { generateDosesFor, checkMissedDoses } = require('./services/doses');

const PORT = process.env.PORT || 4000;

function tick() {
  generateDosesFor();
  const missed = checkMissedDoses();
  if (missed > 0) console.log(`[scheduler] ${missed} doze marcate ca ratate`);
}

app.listen(PORT, () => {
  console.log(`ElderCare API ruleaza pe http://localhost:${PORT}`);
  tick();
  setInterval(tick, 60 * 1000); // o data pe minut (CR4)
});
