export function popolaDatiIniziali(
  formInputs,
  datiEsempio,
  aggiungiRiga,
  aggiungiAsset,
  aggiungiScaglione,
  updateGoalSeekOptions
) {
  formInputs.entrateRicorrenti.splice(0);
  formInputs.entrateLumpSum.splice(0);
  formInputs.usciteRicorrenti.splice(0);
  formInputs.usciteLumpSum.splice(0);
  formInputs.assetAllocation.splice(0);
  formInputs.taxBrackets.splice(0);

  datiEsempio.entrateRicorrenti.forEach((d) =>
    aggiungiRiga("entrateRicorrenti", d)
  );
  datiEsempio.entrateLumpSum.forEach((d) => aggiungiRiga("entrateLumpSum", d));
  datiEsempio.usciteRicorrenti.forEach((d) =>
    formInputs.usciteRicorrenti.push(d)
  );
  datiEsempio.usciteLumpSum.forEach((d) => formInputs.usciteLumpSum.push(d));

  datiEsempio.assetAllocation.forEach((a) => aggiungiAsset(a));
  datiEsempio.taxBrackets.forEach((b) => aggiungiScaglione(b));
  updateGoalSeekOptions();
}