import { createContext, useContext, useState, ReactNode } from 'react'

interface LanguageContextType {
  language: 'nl' | 'en'
  setLanguage: (lang: 'nl' | 'en') => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Dutch translations
const translations = {
  'app.title': 'BST Management',
  'nav.dashboard': 'Dashboard',
  'nav.radios': 'Radio\'s',
  'nav.accessories': 'Accessoires',
  'nav.issue': 'Afgifte',
  'nav.installation': 'Installatie',
  'radios.add': 'Radio Toevoegen',
  'radios.edit': 'Bewerken',
  'radios.delete': 'Verwijderen',
  'radios.actions': 'Acties',
  'accessories.title': 'Accessoires',
  'accessories.add': 'Accessoire Toevoegen',
  'issue.title': 'Afgifte',
  'installation.title': 'Installatie',
  'common.save': 'Opslaan',
  'common.cancel': 'Annuleren',
  'common.edit': 'Bewerken',
  'common.delete': 'Verwijderen',
  'common.confirm': 'Bevestigen',
  'common.confirm_delete': 'Weet je zeker dat je dit item permanent wilt verwijderen?',
  'common.loading': 'Laden...',
  'common.error': 'Er is een fout opgetreden',
  'common.success': 'Succesvol opgeslagen',
  'common.search': 'Zoeken...',
  'common.filter': 'Filteren',
  'common.export': 'Exporteren',
  'common.import': 'Importeren',
  'common.refresh': 'Vernieuwen',
  'common.close': 'Sluiten',
  'common.back': 'Terug',
  'common.next': 'Volgende',
  'common.previous': 'Vorige',
  'common.page': 'Pagina',
  'common.of': 'van',
  'common.items': 'items',
  'common.showing': 'Toont',
  'common.to': 'tot',
  'common.entries': 'entries',
  'common.no_data': 'Geen gegevens beschikbaar',
  'common.no_results': 'Geen resultaten gevonden',
  'common.try_again': 'Probeer opnieuw',
  'common.retry': 'Opnieuw proberen',
  'common.details': 'Details',
  'common.history': 'Geschiedenis',
  'common.timestamp': 'Tijdstempel',
  'common.action': 'Actie',
  'common.description': 'Beschrijving',
  'common.old_value': 'Oude waarde',
  'common.new_value': 'Nieuwe waarde',
  'common.vehicle_info': 'Voertuig informatie',
  'common.vehicle_merk': 'Voertuig merk',
  'common.vehicle_model': 'Voertuig model',
  'common.vehicle_afdeling': 'Voertuig afdeling',
  'common.issued_to': 'Afgegeven aan',
  'common.issued_at': 'Afgegeven op',
  'common.installed_at': 'Geïnstalleerd op',
  'common.notes': 'Notities',
  'common.required': 'Verplicht',
  'common.optional': 'Optioneel',
  'common.yes': 'Ja',
  'common.no': 'Nee',
  'common.all': 'Alle',
  'common.none': 'Geen',
  'common.select': 'Selecteren',
  'common.clear': 'Wissen',
  'common.reset': 'Resetten',
  'common.apply': 'Toepassen',
  'common.done': 'Klaar',
  'common.finish': 'Voltooien',
  'common.start': 'Start',
  'common.stop': 'Stop',
  'common.pause': 'Pauzeren',
  'common.resume': 'Hervatten',
  'common.enable': 'Inschakelen',
  'common.disable': 'Uitschakelen',
  'common.active': 'Actief',
  'common.inactive': 'Inactief',
  'common.enabled': 'Ingeschakeld',
  'common.disabled': 'Uitgeschakeld',
  'common.visible': 'Zichtbaar',
  'common.hidden': 'Verborgen',
  'common.public': 'Openbaar',
  'common.private': 'Privé',
  'common.draft': 'Concept',
  'common.published': 'Gepubliceerd',
  'common.archived': 'Gearchiveerd',
  'common.deleted': 'Verwijderd',
  'common.created': 'Aangemaakt',
  'common.updated': 'Bijgewerkt',
  'common.modified': 'Gewijzigd',
  'common.changed': 'Veranderd',
  'common.added': 'Toegevoegd',
  'common.removed': 'Verwijderd',
  'common.moved': 'Verplaatst',
  'common.copied': 'Gekopieerd',
  'common.duplicated': 'Gedupliceerd',
  'common.imported': 'Geïmporteerd',
  'common.exported': 'Geëxporteerd',
  'common.uploaded': 'Geüpload',
  'common.downloaded': 'Gedownload',
  'common.synced': 'Gesynchroniseerd',
  'common.validated': 'Gevalideerd',
  'common.verified': 'Geverifieerd',
  'common.approved': 'Goedgekeurd',
  'common.rejected': 'Afgewezen',
  'common.pending': 'In behandeling',
  'common.processing': 'Verwerken',
  'common.completed': 'Voltooid',
  'common.failed': 'Mislukt',
  'common.cancelled': 'Geannuleerd',
  'common.expired': 'Verlopen',
  'common.scheduled': 'Gepland',
  'common.running': 'Actief',
  'common.stopped': 'Gestopt',
  'common.paused': 'Gepauzeerd',
  'common.resumed': 'Hervat',
  'common.started': 'Gestart',
  'common.finished': 'Beëindigd',
  'common.ended': 'Beëindigd',
  'common.begun': 'Begonnen',
  'common.continued': 'Voortgezet',

  // Brands
  'brands.title': 'Merken Beheer',
  'brands.subtitle': 'Beheer merken, categorieën en modellen',
  'brands.addBrand': 'Merk Toevoegen',
  'brands.editBrand': 'Merk Bewerken',
  'brands.addCategory': 'Categorie Toevoegen',
  'brands.editCategory': 'Categorie Bewerken',
  'brands.addModel': 'Model Toevoegen',
  'brands.editModel': 'Model Bewerken',
  'brands.name': 'Naam',
  'brands.description': 'Beschrijving',
  'brands.totalBrands': 'Totaal Merken',
  'brands.totalCategories': 'Totaal Categorieën',
  'brands.totalModels': 'Totaal Modellen',
  'brands.namePlaceholder': 'Bijv. Motorola',
  'brands.categoryNamePlaceholder': 'Bijv. Portable Radios',
  'brands.modelNamePlaceholder': 'Bijv. DP4400',
  'brands.descriptionPlaceholder': 'Optionele beschrijving...',

  // Radios
  'radios.title': 'Radio\'s',
  'radios.subtitle': 'Beheer van radiocommunicatie apparatuur',
  'radios.addRadio': 'Radio Toevoegen',
  'radios.editRadio': 'Radio Bewerken',
  'radios.deleteRadio': 'Radio Verwijderen',
  'radios.id': 'ID',
  'radios.merk': 'Merk',
  'radios.model': 'Model',
  'radios.type': 'Type',
  'radios.serienummer': 'Serienummer',
  'radios.alias': 'Alias',
  'radios.afdeling': 'Afdeling',
  'radios.opmerking': 'Opmerking',
  'radios.registratiedatum': 'Registratiedatum',
  'radios.addedBy': 'Toegevoegd door',
  'radios.portable': 'Portable',
  'radios.mobile': 'Mobile',
  'radios.base': 'Base',
  'radios.total': 'Totaal',
  'radios.active': 'Actief',
  'radios.defect': 'Defect',
  'radios.searchPlaceholder': 'Zoek radio\'s...',
  'radios.noRadios': 'Geen radio\'s gevonden',
  'radios.loading': 'Radio\'s laden...',
  'radios.error': 'Fout bij laden van radio\'s',
  'radios.confirmDelete': 'Weet je zeker dat je deze radio wilt verwijderen?',
  'radios.deleteSuccess': 'Radio succesvol verwijderd',
  'radios.deleteError': 'Fout bij verwijderen van radio',
  'radios.createSuccess': 'Radio succesvol aangemaakt',
  'radios.createError': 'Fout bij aanmaken van radio',
  'radios.updateSuccess': 'Radio succesvol bijgewerkt',
  'radios.updateError': 'Fout bij bijwerken van radio',

  // Navigation
  'nav.brands': 'Merken',
}

interface LanguageProviderProps {
  children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<'nl' | 'en'>('nl')

  const t = (key: string): string => {
    return translations[key as keyof typeof translations] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
