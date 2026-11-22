import {ENEMY_TYPES, PAWNS_PER_PAGE, generateEnemyPawns, selectedEnemyPawns} from './enemy-pawns.js?v=pawnbase1';

const form = document.getElementById('enemy-pawns-form');
const button = document.getElementById('enemy-pawns-download');
const status = document.getElementById('enemy-pawns-status');
document.getElementById('enemy-pawn-options').innerHTML = ENEMY_TYPES.map(type => `
  <section class="play-panel enemy-pawn-option">
    <h2>${type.name}</h2><p>${type.weapon}</p>
    <div class="enemy-pawn-previews">${type.portraits.map((portrait,index) => `<img src="./${portrait}" alt="${type.name} · Variante ${index+1}" width="96" height="144" loading="lazy">`).join('')}</div>
    <label for="enemy-${type.id}">Anzahl <input id="enemy-${type.id}" name="${type.id}" type="number" value="0" min="0" max="50" step="1" required></label>
  </section>`).join('');
const quantities = () => Object.fromEntries(new FormData(form));
function update() {
  try {
    const count = selectedEnemyPawns(quantities()).length;
    document.getElementById('enemy-pawns-total').textContent = `${count} Figuren · ${Math.ceil(count/PAWNS_PER_PAGE)} A4-Seite(n)`;
    button.disabled = form.getAttribute('aria-busy') === 'true' || !form.checkValidity();
    status.textContent = '';
  } catch (error) {
    document.getElementById('enemy-pawns-total').textContent = error.message;
    button.disabled = true;
  }
}
form.addEventListener('input', update);
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (form.getAttribute('aria-busy') === 'true') return;
  if (!form.reportValidity()) return;
  const selection = quantities();
  button.disabled = true;
  form.setAttribute('aria-busy', 'true');
  status.textContent = 'Druck-PDF wird erstellt …';
  try {
    const result = await generateEnemyPawns(selection);
    const url = URL.createObjectURL(new Blob([result.bytes], {type:'application/pdf'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = result.filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    update();
    status.textContent = 'Druck-PDF erstellt. Beim Drucken 100 % / tatsächliche Größe wählen.';
  } catch (error) {
    update();
    status.textContent = 'PDF konnte nicht erstellt werden. '+error.message;
  } finally {
    form.removeAttribute('aria-busy');
    button.disabled = !form.checkValidity();
  }
});
update();
