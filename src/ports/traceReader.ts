/**
 * Puerto: lectura de trace.zip de Playwright para time-travel (DOM en un instante).
 * Formato interno de Playwright no es público; el adapter es best-effort y puede requerir actualización en upgrades.
 */

export interface TraceReaderPort {
  /**
   * Devuelve representación textual del DOM en el instante más cercano a millisecondOffset desde el inicio del trace.
   * Retorna null si el trace no existe o no hay snapshot en ese rango.
   */
  getDomSnapshotAtTime(
    tracePath: string,
    millisecondOffset: number
  ): Promise<string | null>;
}
