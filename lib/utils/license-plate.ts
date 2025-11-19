/**
 * Deduce el año aproximado de matriculación basándose en la matrícula española
 * Formato español desde 2000: 4 dígitos + 3 letras (ej: 1234ABC)
 * Los primeros 4 dígitos indican el orden de matriculación
 */
export function deduceYearFromLicensePlate(licensePlate: string): number {
  // Limpiar la matrícula
  const cleaned = licensePlate.replace(/\s+/g, "").toUpperCase()

  // Formato nuevo (desde 2000): 4 dígitos + 3 letras
  const newFormatMatch = cleaned.match(/^(\d{4})[A-Z]{3}$/)
  if (newFormatMatch) {
    const number = Number.parseInt(newFormatMatch[1])

    // Rangos aproximados basados en el sistema español
    if (number >= 0 && number <= 999) return 2000
    if (number >= 1000 && number <= 1999) return 2001
    if (number >= 2000 && number <= 2999) return 2002
    if (number >= 3000 && number <= 3999) return 2003
    if (number >= 4000 && number <= 4999) return 2004
    if (number >= 5000 && number <= 5999) return 2005
    if (number >= 6000 && number <= 6999) return 2006
    if (number >= 7000 && number <= 7999) return 2007
    if (number >= 8000 && number <= 8999) return 2008
    if (number >= 9000 && number <= 9999) return 2009

    // Para matrículas más recientes, estimación más precisa
    if (number >= 1000 && number <= 1999) return 2010
    if (number >= 2000 && number <= 2999) return 2011
    if (number >= 3000 && number <= 3999) return 2012
    if (number >= 4000 && number <= 4999) return 2013
    if (number >= 5000 && number <= 5999) return 2014
    if (number >= 6000 && number <= 6999) return 2015
    if (number >= 7000 && number <= 7999) return 2016
    if (number >= 8000 && number <= 8999) return 2017
    if (number >= 9000 && number <= 9999) return 2018
  }

  // Formato antiguo o matrículas especiales (E para tractores, R para remolques)
  const specialMatch = cleaned.match(/^[ER](\d{4})[A-Z]{3}$/)
  if (specialMatch) {
    const number = Number.parseInt(specialMatch[1])
    // Estimación para matrículas especiales
    if (number >= 0 && number <= 3000) return 2010
    if (number >= 3000 && number <= 6000) return 2015
    if (number >= 6000 && number <= 9000) return 2020
  }

  // Si no se puede deducir, retornar año actual
  return new Date().getFullYear()
}
