export function leggiInput(formInputs) {
  const inputs = {
    impostazioni: {
      etaIniziale: parseInt(formInputs.etaIniziale),
      capitaleIniziale: parseFloat(formInputs.capitaleIniziale),
      tassoInflazione: parseFloat(formInputs.tassoInflazione),
      regolaFIRE: parseFloat(formInputs.regolaFIRE),
      tassazioneRendite: parseFloat(formInputs.tassazioneRendite),
      etaRitiro: parseInt(formInputs.etaRitiro),
      numeroSimulazioni: parseInt(formInputs.numeroSimulazioni),
      simMode: formInputs.simMode,
      
      strategiaPrelievo: formInputs.strategiaPrelievo,
      percentualePrelievo: parseFloat(formInputs.percentualePrelievo) || 0,
      scenarioCrisi: formInputs.scenarioCrisi,
      rendimentoCapitale: formInputs.assetAllocation.reduce(
        (sum, asset) =>
          sum + (parseFloat(asset.quota) / 100) * parseFloat(asset.rendimento),
        0
      ),
      deviazioneStandard: formInputs.assetAllocation.reduce(
        (sum, asset) =>
          sum + (parseFloat(asset.quota) / 100) * parseFloat(asset.devStd),
        0
      ),
      correlazioneAsset: parseFloat(formInputs.correlazioneAsset) || 0,
    },
    taxBrackets: formInputs.taxBrackets.map((b) => ({
      finoA: b.finoA === Infinity ? Infinity : parseFloat(b.finoA),
      aliquota: parseFloat(b.aliquota),
    })),
    assetAllocation: formInputs.assetAllocation.map((a) => ({
      nome: a.nome,
      quota: parseFloat(a.quota),
      rendimento: parseFloat(a.rendimento),
      devStd: parseFloat(a.devStd),
      tipoConto: a.tipoConto, // es. "tassabile", "esente", "differito"
      tassazioneSpecifica: parseFloat(a.tassazioneSpecifica) || 0,
    })),
    entrate: {
      ricorrenti: formInputs.entrateRicorrenti.map((e) => ({
        desc: e.desc,
        valore: parseFloat(e.valore),
        isTodayValue: e.isTodayValue,
        inizio: parseInt(e.inizio),
        fine: parseInt(e.fine),
        incr: parseFloat(e.incr),
        inPensione: e.inPensione,
        taxRegime: e.taxRegime,
        aliquotaSost: parseFloat(e.aliquotaSost),
      })),
      lumpSum: formInputs.entrateLumpSum.map((e) => ({
        desc: e.desc,
        importo: parseFloat(e.importo),
        isTodayValue: e.isTodayValue,
        anno: parseInt(e.anno),
      })),
    },
    uscite: {
      ricorrenti: formInputs.usciteRicorrenti.map((u) => ({
        desc: u.desc,
        valore: parseFloat(u.valore),
        isTodayValue: u.isTodayValue,
        inizio: parseInt(u.inizio),
        fine: parseInt(u.fine),
        incr: parseFloat(u.incr),
        inflazioneSpecifica: parseFloat(u.inflazioneSpecifica),
      })),
      lumpSum: formInputs.usciteLumpSum.map((u) => ({
        desc: u.desc,
        importo: parseFloat(u.importo),
        isTodayValue: u.isTodayValue,
        anno: parseInt(u.anno),
      })),
    },
    debiti: formInputs.debiti.map((d) => ({
      desc: d.desc,
      tipoDebito: d.tipoDebito,
      importoIniziale: parseFloat(d.importoIniziale),
      tassoInteresse: parseFloat(d.tassoInteresse),
      durataAnni: parseInt(d.durataAnni),
      annoInizio: parseInt(d.annoInizio),
    })),
  };

  // Validazione di base
  if (
    isNaN(inputs.impostazioni.etaIniziale) ||
    inputs.impostazioni.etaIniziale <= 0
  ) {
    // mostraNotifica(
    //   "Errore di Input",
    //   "L'età iniziale deve essere un numero valido e maggiore di zero.",
    //   true
    // );
    return null;
  }
  if (
    isNaN(inputs.impostazioni.capitaleIniziale) ||
    inputs.impostazioni.capitaleIniziale < 0
  ) {
    // mostraNotifica(
    //   "Errore di Input",
    //   "Il capitale iniziale deve essere un numero valido e non negativo.",
    //   true
    // );
    return null;
  }
  if (
    inputs.assetAllocation.reduce((sum, asset) => sum + asset.quota, 0) !== 100
  ) {
    // mostraNotifica(
    //   "Errore di Input",
    //   "La somma delle quote di asset allocation deve essere esattamente 100%.",
    //   true
    // );
    return null;
  }
  if (inputs.taxBrackets.length === 0) {
    // mostraNotifica(
    //   "Errore di Input",
    //   "Devi definire almeno uno scaglione fiscale.",
    //   true
    // );
    return null;
  }

  return inputs;
}